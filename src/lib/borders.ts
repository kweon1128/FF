// 테두리와 의미 테두리.
// 선의 굵기에도 간격·크기·모서리처럼 층이 둘이다. 토대(굵기 그 자체: --thickness-1: 1px)와 의미(쓰임 이름: --border-width-edge: var(--thickness-1)).
// 토대의 이름은 px 숫자 그대로이고, 앞머리는 Tailwind가 모르는 --thickness-다.
// 의미 테두리는 두 종류다. 테두리 선(--border-width-이름 → border-이름, border-t-이름)과 외곽선(--outline-width-이름 → outline-이름).
// 테두리 선은 상자의 자리를 차지하는 선이고(입력칸의 테두리, 구역 사이의 구분선), 외곽선은 자리를 차지하지 않고 상자 밖에 두르는 선이다(초점 표시).
// 이름은 굵기(thin, thick)가 아니라 쓰임(edge, divider, focus)으로 짓는다. 같은 1px라도 쓰임이 다르면 이름을 나눈다.
// 색 이름과 겹치면 안 된다. border-이름과 outline-이름은 색도 읽기 때문에(border-hairline), --color-edge가 있으면 border-edge는 색이 된다.
// 설명과 예시는 값 뒤의 주석에 적는다(효과와 같은 방식. 종류의 이름으로 시작한다).
//   --border-width-edge: var(--thickness-1); /* 테두리(입력칸): 입력칸, 버튼, 목록 상자의 테두리 | 이름 | 버튼: 취소 */

import type { Token } from './api'
import { KINDS, THICKNESS_REF, type Kind } from './catalog'

export type BorderKind = 'border' | 'outline'

/** 주석 맨 앞에 적는 종류의 이름. */
export const BORDER_TITLES: Record<BorderKind, string> = { border: '테두리', outline: '외곽선' }

/** 테두리 선이나 외곽선인지. 두 종류는 판과 패널, 추가 창을 함께 쓴다. */
export const isBorderKind = (kind: Kind) => kind.id === 'border' || kind.id === 'outline'

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
 * 적어 두지 않은 값은 이름에서 짐작한다(divider는 구분선, focus는 초점). 짐작할 수 없으면 종류의 첫 모양을 쓴다.
 */
export type BorderShape = 'input' | 'button' | 'box' | 'divider' | 'side' | 'focus' | 'mark'

export const BORDER_SHAPES: { id: BorderShape; kind: BorderKind; label: string; hint: string }[] = [
  { id: 'input', kind: 'border', label: '입력칸', hint: '입력칸의 테두리' },
  { id: 'button', kind: 'border', label: '버튼', hint: '테두리가 있는 버튼' },
  { id: 'box', kind: 'border', label: '상자', hint: '목록 상자, 카드, 창의 테두리' },
  { id: 'divider', kind: 'border', label: '구분선', hint: '위아래 구역 사이의 선' },
  { id: 'side', kind: 'border', label: '세로 구분선', hint: '좌우 영역 사이의 선' },
  { id: 'focus', kind: 'outline', label: '초점', hint: '자판으로 옮겨 간 버튼의 표시' },
  { id: 'mark', kind: 'outline', label: '표시', hint: '가리키는 글자에 두르는 선' },
]

/** 모양마다의 기본 예시 문구. 여럿을 늘어놓는 모양(상자, 구분선, 세로 구분선)은 ", "로 나눠 적는다. */
export const BORDER_WORDS: Record<BorderShape, string> = {
  input: '이름',
  button: '취소',
  box: '첫째, 둘째',
  divider: '이름, 설명',
  side: '메뉴, 내용',
  focus: '저장',
  mark: '제목',
}

/** 문구를 ", "로 나눠 여럿을 늘어놓는 모양. */
export const isBorderListShape = (shape: BorderShape) => ['box', 'divider', 'side'].includes(shape)

/** 모양을 적지 않은 값의 모양. */
export function guessBorderShape(kind: BorderKind, short: string): BorderShape {
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  if (kind === 'outline') return has('mark', 'hot', 'hover', 'select', 'selection') ? 'mark' : 'focus'
  if (has('divider', 'separator', 'rule', 'hr')) return 'divider'
  if (has('side', 'panel', 'nav')) return 'side'
  if (has('button', 'btn')) return 'button'
  if (has('box', 'card', 'list', 'dialog', 'frame')) return 'box'
  return 'input'
}

/** 예시 하나. 어떤 요소로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type BorderExample = { shape: BorderShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const labelsOf = (kind: BorderKind) => BORDER_SHAPES.filter((s) => s.kind === kind).map((s) => s.label).join('|')

/**
 * 주석에서 설명과 예시들을 읽는다. "테두리(입력칸): 입력칸, 버튼의 테두리 | 이름 | 버튼: 취소"처럼 종류의 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * shape는 첫 예시를 그릴 모양이고, picked는 주석에 직접 적혀 있던 모양이다(없으면 undefined. 그때 shape는 이름에서 짐작한 것이다).
 */
export function readBorderNote(kind: BorderKind, note: string | undefined, short: string): { text: string; shape: BorderShape; picked?: BorderShape; words: string; more: BorderExample[] } {
  const all = (note ?? '').trim()
  const own = (label: string) => BORDER_SHAPES.find((s) => s.kind === kind && s.label === label)?.id
  const m = new RegExp(`^${BORDER_TITLES[kind]}(?:\\((${labelsOf(kind)})\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[1] ? own(m[1]) : undefined
  const shape = picked ?? guessBorderShape(kind, short)
  const parts = m ? m[2].split(MARK).map((p) => p.trim()) : [all]
  const head = new RegExp(`^(${labelsOf(kind)})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).map((p): BorderExample => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? { shape: id, words: h![2].trim() } : { shape, words: p }
  })
  return { text: parts[0], shape, ...(picked ? { picked } : {}), words: parts[1] ?? '', more }
}

/** 주석에 적을 글자. 종류의 이름은 언제나 적고, 첫 예시의 모양은 직접 고른 것만 적는다. */
export function writeBorderNote(kind: BorderKind, text: string, shape?: BorderShape, words = '', more: BorderExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: BorderShape) => BORDER_SHAPES.find((s) => s.id === id)!.label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  if (!body && !shape) return ''
  const head = shape ? `${BORDER_TITLES[kind]}(${label(shape)})` : BORDER_TITLES[kind]
  return body ? `${head}: ${body}` : `${head}:`
}
