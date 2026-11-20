// 크기와 의미 크기.
// 크기에는 토대(길이 그 자체: --length-32: 32px)와 의미(쓰임 이름: --height-control: var(--length-32))가 있다. 간격과 의미 간격의 짜임과 같다.
// 토대의 이름은 px 숫자 그대로이고, 앞머리는 Tailwind가 모르는 --length-다. --spacing-8이나 --size-32처럼 Tailwind가 아는 이름이면
// 숫자 클래스(h-8, size-32)가 그 값을 따라가서, 값을 바꿨을 때 숫자로 적은 자리가 말없이 함께 바뀐다.
// 의미 크기는 세 종류다. 높이(--height-이름 → h-이름), 폭(--width-이름 → w-이름), 정사각형(--size-이름 → size-이름).
// 최소와 최대는 종류를 따로 두지 않는다. 높이는 min-h-이름·max-h-이름이 같은 이름을 읽고, 폭은 max-w-(--width-이름)처럼 변수를 가리켜 쓴다.
// 분류와 설명, 예시는 값 뒤의 주석에 적는다(의미 간격과 같은 방식).
//   --height-control: var(--length-32); /* 입력칸(입력칸): 입력칸, 버튼의 높이 | 이름 | 버튼: 취소, 추가 */

import type { Token } from './api'
import { KINDS, LENGTH_REF, type Kind } from './catalog'

/** 의미 크기의 분류. 무엇의 크기인지다. 판은 이 차례로 묶어 보여 준다. */
import { groupFromNote, headOf } from './kindnote'
import { partGroups, type Part } from './parts'

/**
 * 분류는 의미 간격과 같은 목록이다. 그 크기가 어느 컴포넌트의 것인지로 나눈다.
 * 같은 이름의 분류에서 그 컴포넌트의 간격(의미 간격 판)과 크기(의미 크기 판)를 찾게 하려는 것이다.
 * 예전에는 컨트롤과 영역 둘로만 나눴는데, 둘로는 너무 커서 판이 그 안에서 "요소"(입력칸, 메뉴, 창)로 한 번 더 묶어야 했다. 그 요소가 곧 컴포넌트라서 분류로 올렸다.
 */
export type SizeGroup = Part

export const SIZE_GROUPS = partGroups({
  button: '버튼, 아이콘 버튼',
  input: '입력칸, 고르는 칸, 체크 상자',
  list: '메뉴와 목록의 줄과 너비',
  table: '표의 줄과 칸',
  card: '카드의 너비와 높이',
  board: '판의 줄과 열',
  panel: '패널의 너비',
  dialog: '창과 떠 있는 것, 상단 바',
  page: '본문의 너비',
  other: '목록에 없는 쓰임',
})
/**
 * 예전 파일의 주석에 남아 있을 수 있는, 이제 없는 분류의 이름(컨트롤, 영역, 견본). 분류를 적지 않은 것으로 읽어 예시의 모양과 이름에서 짐작하고("그 밖"으로 보내지 않는다),
 * 그 값을 고치면 지금의 분류로 다시 적힌다.
 */
const OLD_GROUP_LABELS = ['컨트롤', '영역', '견본']
// "그림"(예시 그림 속에서만 쓰는 크기) 분류는 두지 않는다. 예시는 실제로 쓰는 것을 옮겨 그리는 것이라, 그림만을 위한 크기는 디자인의 규칙이 아니다.
// 그림 속의 막대나 작게 그린 버튼의 길이는 그리는 코드에 직접 적는다.

/** 높이, 폭, 정사각형인지. 세 종류는 판과 패널, 추가 창을 함께 쓴다. */
export const isSizeKind = (kind: Kind) => kind.id === 'height' || kind.id === 'width' || kind.id === 'square'

/** 의미 크기가 가리키는 토대 크기의 변수 이름. 가리키지 않으면 null. */
export const lengthRefOf = (value: string) => LENGTH_REF.exec(value.trim())?.[1] ?? null

/** 의미 크기의 실제 길이(가리키는 토대 크기의 값). 가리키는 값이 없어졌으면 null. */
export function resolveLength(tokens: Token[], value: string): string | null {
  const ref = lengthRefOf(value)
  return ref ? (tokens.find((t) => t.name === ref && KINDS.length.matches(t.name))?.value ?? null) : null
}

/**
 * 분류를 적지 않은 값(과 예전 분류 이름으로 적힌 값)의 분류. 예시의 모양이 적혀 있으면 그 모양이 드는 분류이고, 없으면 이름에서 짐작한다. 짐작할 수 없으면 그 밖이다.
 * 패널, 페이지, 왼쪽 메뉴는 "창" 모양으로 그리지만 창이 아니라서 이름을 먼저 본다.
 */
export function guessSizeGroup(short: string, shape?: SizeShape): SizeGroup {
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  if (has('panel', 'sidebar', 'inspector')) return 'panel'
  if (has('page', 'content', 'container')) return 'page'
  if (has('nav')) return 'list'
  if (shape) return SHAPE_GROUP[shape]
  if (has('button', 'btn')) return 'button'
  if (has('input', 'control', 'field', 'cell', 'picker', 'checkbox', 'check', 'swatch', 'compact', 'stepper', 'select', 'slider')) return 'input'
  if (has('row', 'menu', 'list', 'item')) return 'list'
  if (has('table', 'th', 'td')) return 'table'
  if (has('card')) return 'card'
  if (has('board', 'column', 'heading', 'preview', 'stage')) return 'board'
  if (has('dialog', 'modal', 'popover', 'toast', 'bar')) return 'dialog'
  return 'other'
}

/** 예시의 모양. 그 크기가 무엇의 크기인지다. 실제 화면의 조각으로 그린다. */
export type SizeShape =
  | 'input' | 'button' | 'row' | 'field' | 'segment' | 'value' | 'slider' | 'iconbutton' | 'icon' | 'check' | 'mark' | 'handle' | 'knob'
  | 'bar' | 'heading' | 'line' | 'toast' | 'card' | 'list' | 'menu' | 'frame' | 'column'
  | 'color' | 'preview' | 'picker' | 'stage'
  | 'placeholder' | 'badge' | 'dot' | 'box' | 'select'

export const SIZE_SHAPES: { id: SizeShape; label: string; hint: string }[] = [
  { id: 'input', label: '입력칸', hint: '테두리가 있는 입력칸' },
  { id: 'button', label: '버튼', hint: '나란한 버튼. 마지막은 채운 버튼' },
  { id: 'row', label: '줄', hint: '마우스를 올린 메뉴 줄' },
  { id: 'field', label: '작은 입력칸', hint: '표와 줄 안에 놓는 입력칸' },
  { id: 'segment', label: '전환 버튼', hint: '여럿 가운데 하나를 고르는 칸들' },
  { id: 'value', label: '숫자 칸', hint: '올리고 내리는 버튼 사이의 숫자' },
  { id: 'slider', label: '슬라이더', hint: '색 고르는 창의 슬라이더' },
  { id: 'iconbutton', label: '아이콘 버튼', hint: '아이콘만 있는 버튼' },
  { id: 'icon', label: '아이콘', hint: '아이콘' },
  { id: 'check', label: '체크박스', hint: '체크 상자' },
  { id: 'mark', label: '체크 표시', hint: '체크 상자 안의 표시' },
  { id: 'handle', label: '손잡이', hint: '선택한 것의 꼭짓점 사각형' },
  { id: 'knob', label: '둥근 손잡이', hint: '색을 고르는 둥근 손잡이' },
  { id: 'bar', label: '상단 바', hint: '화면 맨 위의 막대' },
  { id: 'heading', label: '제목 줄', hint: '제목과 그 오른쪽의 버튼' },
  { id: 'line', label: '글줄', hint: '체크 상자가 놓인 글 한 줄' },
  { id: 'toast', label: '알림', hint: '화면 아래의 알림' },
  { id: 'card', label: '카드', hint: '카드의 이름 줄' },
  { id: 'list', label: '목록', hint: '줄이 넘치면 스크롤되는 목록 상자' },
  { id: 'menu', label: '메뉴', hint: '떠 있는 메뉴' },
  { id: 'frame', label: '창', hint: '패널, 창처럼 내용을 담는 상자' },
  { id: 'column', label: '열', hint: '한 줄 안의 글자 칸' },
  { id: 'select', label: '고르는 칸', hint: '고르는 칸의 이름 자리' },
  { id: 'color', label: '색 칸', hint: '색을 칠한 칸' },
  { id: 'preview', label: '미리보기', hint: '컴포넌트 미리보기 칸' },
  { id: 'picker', label: '색 고르는 판', hint: '색 고르는 창에서 색을 고르는 네모' },
  { id: 'stage', label: '무대', hint: '효과를 얹어 보이는 무대' },
  { id: 'placeholder', label: '자리 표시', hint: '글 대신 그리는 회색 막대' },
  { id: 'badge', label: '뱃지', hint: '둥근 뱃지' },
  { id: 'dot', label: '점', hint: '둥근 점' },
  { id: 'box', label: '상자', hint: '옅게 칠한 상자' },
]

/** 예시의 모양이 드는 분류. 분류를 적지 않은 값의 분류를 짐작할 때 쓴다(guessSizeGroup). */
const SHAPE_GROUP: Record<SizeShape, SizeGroup> = {
  input: 'input', field: 'input', value: 'input', slider: 'input', check: 'input', mark: 'input', select: 'input', color: 'input', line: 'input',
  button: 'button', segment: 'button', iconbutton: 'button',
  row: 'list', list: 'list', menu: 'list',
  card: 'card',
  heading: 'board', column: 'board', preview: 'board', stage: 'board',
  bar: 'dialog', toast: 'dialog', frame: 'dialog', picker: 'dialog',
  icon: 'other', handle: 'other', knob: 'other', placeholder: 'other', badge: 'other', dot: 'other', box: 'other',
}

/**
 * 추가 창에서 종류와 분류마다 처음 골라 두는 예시의 모양. 그 자리에서 가장 흔한 쓰임이다. 직접 고르기 전까지만 종류와 분류를 따라 바뀐다.
 * 입력칸이면 높이는 입력칸, 너비는 고르는 칸의 이름 자리, 정사각형은 체크박스처럼 그 분류에서 그 길이를 가장 흔히 정하는 것을 골랐다.
 */
export const SIZE_SHAPE_FOR: Record<'height' | 'width' | 'square', Record<SizeGroup, SizeShape>> = {
  height: { button: 'button', input: 'input', list: 'row', table: 'row', card: 'card', board: 'heading', panel: 'bar', dialog: 'bar', page: 'bar', other: 'input' },
  width: { button: 'button', input: 'select', list: 'menu', table: 'column', card: 'card', board: 'column', panel: 'frame', dialog: 'frame', page: 'frame', other: 'frame' },
  square: { button: 'iconbutton', input: 'check', list: 'icon', table: 'box', card: 'box', board: 'color', panel: 'box', dialog: 'box', page: 'box', other: 'icon' },
}

/** 모양마다의 기본 예시 문구. 여럿을 늘어놓는 모양은 ", "로 나눠 하나씩 놓는다. */
export const SIZE_WORDS: Record<SizeShape, string> = {
  input: '이름',
  button: '취소, 추가',
  row: '색상',
  field: '16px',
  segment: '없음, 글자 앞, 글자 뒤',
  value: '16px',
  slider: '',
  iconbutton: '',
  icon: '',
  check: '',
  mark: '',
  handle: '',
  knob: '',
  bar: '제목',
  heading: '제목, 추가',
  line: '이름',
  toast: '저장했어요',
  card: '이름',
  list: '첫째, 둘째',
  menu: '첫째, 둘째',
  frame: '제목',
  column: '이름, 값',
  select: '높이, h-이름',
  color: '',
  preview: '버튼',
  picker: '',
  stage: '',
  placeholder: '',
  badge: '이름',
  dot: '',
  box: '',
}

/** 여럿을 늘어놓는 모양인지. 문구를 ", "로 나눈다. */
export const isSizeListShape = (shape: SizeShape) => ['button', 'segment', 'heading', 'list', 'menu', 'column', 'frame', 'select'].includes(shape)

/** 예시 하나. 어떤 것으로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type SizeExample = { shape: SizeShape; words: string }

const WORDS_MARK = ' | '
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const LABELS = SIZE_SHAPES.map((s) => s.label)
  // 긴 이름을 먼저 견준다("아이콘 버튼"이 "아이콘"으로 읽히지 않게).
  .sort((a, b) => b.length - a.length)
  .join('|')
const GROUP_LABELS = [...SIZE_GROUPS.map((g) => g.label), ...OLD_GROUP_LABELS].join('|')
const own = (label: string) => SIZE_SHAPES.find((s) => s.label === label)?.id
/**
 * 예전 이름으로 적힌 주석을 지금의 이름으로 읽는다. 분류 "조작"은 "컨트롤", 분류 "틀"은 "영역", 모양 "틀"은 "창"으로 이름이 바뀌었다.
 * 읽을 때만 고쳐 읽고, 그 값을 고쳐 저장하면 지금의 이름으로 적힌다.
 */
const modern = (note: string) =>
  note
    .replace(/^조작(?=\s*[(:])/, '컨트롤')
    .replace(/^틀(?=\s*[(:])/, '영역')
    .replace(/^(컨트롤|영역)\(틀\)/, '$1(창)')
    .replace(/\|\s*틀\s*:/g, '| 창:')

/**
 * 주석에서 분류와 설명과 예시들을 읽는다. "컨트롤(입력칸): 입력칸, 버튼의 높이 | 이름 | 버튼: 취소, 추가"처럼 분류 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * group은 분류(적혀 있지 않으면 이름에서 짐작한 것). picked는 주석에 직접 적혀 있던 첫 예시의 모양이다.
 * examples는 판에 그릴 예시들이다. 모양을 적지 않은 값은 예시가 없다(의미 간격과 같다. 크기도 이름만으로는 무엇의 크기인지 그림을 정할 수 없다).
 */
export function readSizeNote(
  note: string | undefined,
  short: string,
): { group: SizeGroup; text: string; picked?: SizeShape; words: string; more: SizeExample[]; examples: SizeExample[] } {
  const all = modern((note ?? '').trim())
  const m = new RegExp(`^(${GROUP_LABELS})(?:\\(([^)|]*)\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[2] ? own(m[2]) : undefined
  // 예전 분류 이름(컨트롤, 영역, 견본)으로 적힌 주석은 분류를 적지 않은 것으로 읽어 모양과 이름에서 짐작한다("그 밖"으로 보내지 않는다).
  const group = m ? (SIZE_GROUPS.find((g) => g.label === m[1])?.id ?? guessSizeGroup(short, picked)) : (groupFromNote(all, SIZE_GROUPS, 'other') ?? guessSizeGroup(short))
  // 목록에 없는 분류의 주석(이름(모양): …)도 " | "로 나눠 읽는다. 통째로 설명으로 읽으면 다시 적을 때 문구의 구분이 사라진다.
  const parts = m ? m[3].split(MARK).map((p) => p.trim()) : headOf(all) !== null ? all.split(MARK).map((p) => p.trim()) : [all]
  const words = parts[1] ?? ''
  const head = new RegExp(`^(${LABELS})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).flatMap((p): SizeExample[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { group, text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 분류는 언제나 적고, 첫 예시의 모양은 주석에 적혀 있던 것만 적는다. */
export function writeSizeNote(group: SizeGroup, text: string, shape?: SizeShape, words = '', more: SizeExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: SizeShape) => SIZE_SHAPES.find((s) => s.id === id)!.label
  const groupLabel = SIZE_GROUPS.find((g) => g.id === group)!.label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  const head = shape ? `${groupLabel}(${label(shape)})` : groupLabel
  return body ? `${head}: ${body}` : `${head}:`
}

/**
 * 추가 창에서 예시를 고르면 이름 칸에 채워지는 이름(DESIGN.md dialog-defaults). 그 예시가 보여 주는 쓰임의 영문 이름이다.
 * ff-ds가 실제로 쓰는 이름을 따랐고(사이는 actions, 줄은 rows), 쓰는 이름이 없는 예시만 새로 지었다. 그 이름이 이미 있으면 창은 이름 칸을 비워 둔다.
 */
export const SIZE_NAMES: Record<SizeShape, string> = {
  input: 'control',
  button: 'button',
  row: 'row',
  field: 'compact',
  segment: 'segment',
  value: 'stepper-value',
  slider: 'slider',
  iconbutton: 'icon-button',
  icon: 'icon',
  check: 'checkbox',
  mark: 'check-mark',
  handle: 'handle',
  knob: 'knob',
  bar: 'bar',
  heading: 'heading',
  line: 'line',
  toast: 'toast',
  card: 'card',
  list: 'list',
  menu: 'menu',
  frame: 'dialog',
  column: 'column',
  select: 'picker-name',
  color: 'swatch',
  preview: 'preview',
  picker: 'color-picker',
  stage: 'stage',
  placeholder: 'placeholder',
  badge: 'badge',
  dot: 'dot',
  box: 'box',
}

const SIZE_KIND_LIST = [KINDS.height, KINDS.width, KINDS.square]
/** 그 값이 의미 크기면 그 종류(높이, 너비, 정사각형), 아니면 undefined. */
export const sizeKindOf = (t: Token) => SIZE_KIND_LIST.find((k) => k.matches(t.name))
/** 그 값이 의미 크기면 그 분류, 아니면 null. */
export function sizeGroupOfToken(t: Token): SizeGroup | null {
  const kind = sizeKindOf(t)
  return kind ? readSizeNote(t.note, t.name.slice(kind.prefix.length)).group : null
}
