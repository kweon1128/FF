// 겹치는 차례(z-index): 분류와 설명, 예시를 주석에서 읽고 쓰는 것.
// 층은 하나다. 효과처럼 값에 쓰임의 이름을 붙이고(dialog, toast, listbox) 차례의 숫자를 값으로 적는다.
// 토대를 따로 두지 않는다. 차례의 숫자는 골라 쓰는 재료가 아니라 "무엇보다 위인가"만 뜻해서, 10이나 50이라는 값 자체에는 쓰임이 없다.
// 앞머리는 Tailwind가 읽는 --z-index-다. --z-index-dialog: 50이면 z-dialog 클래스가 생긴다(--z-는 Tailwind가 읽지 않는다).
// 분류와 설명, 예시는 값 뒤의 주석에 적는다(의미 모서리와 같은 방식).
//   --z-index-dialog: 50; /* 화면 위(창): 화면을 가리는 막과 그 위의 창 | 의미 색 추가, 이름, 취소, 추가 */

import { groupFromNote, headOf } from './kindnote'

/** 분류. 무엇의 위에 놓이는가다. 판은 이 차례로 묶어 보여 준다. */
export type LayerGroup = 'app' | 'item' | 'other'

export const LAYER_GROUPS: { id: LayerGroup; label: string; hint: string }[] = [
  // 화면 전체를 놓고 서로 견주는 것들. 창이 떠 있어도 그 위에 떠야 하는 것이 있어서 숫자가 크고 사이가 벌어져 있다.
  { id: 'app', label: '화면 위', hint: '창, 알림, 메뉴, 고르는 목록' },
  // 요소 하나나 캔버스 안에서만 견주는 작은 차례. 고른 것의 표시가 그 요소와 이웃보다 위에 오게 한다.
  { id: 'item', label: '요소 위', hint: '선택 표시, 안내선, 도구' },
  // 목록에 없는 쓰임. 주석에 목록에 없는 분류가 적힌 값도 여기에 놓인다(kindnote.ts의 groupFromNote).
  { id: 'other', label: '그 밖', hint: '목록에 없는 쓰임' },
]

/** 분류를 적지 않은 값의 분류. 이름에서 짐작하고, 짐작할 수 없으면 화면 위다. */
export function guessLayerGroup(short: string): LayerGroup {
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  return has('mark', 'handle', 'callout', 'label', 'guide', 'grid', 'canvas', 'marquee', 'drop', 'line', 'tool', 'item', 'local') ? 'item' : 'app'
}

/** 차례의 숫자. 숫자로 읽을 수 없는 값(calc(), var(), auto)이면 NaN. */
export const layerNumber = (value: string) => (/^-?\d+$/.test(value.trim()) ? Number(value.trim()) : NaN)

/**
 * 예시의 모양. 그것이 무엇 위에 놓이는지를 FF 화면의 실제 요소로 보여 준다(창과 그 뒤의 화면, 창 위의 목록, 고른 줄과 그 이름표).
 * 모양을 적지 않은 값은 예시를 그리지 않는다(의미 간격, 의미 크기, 의미 모서리, 의미 테두리와 같은 규칙이다).
 */
export type LayerShape = 'dialog' | 'toast' | 'sticky' | 'tooltip' | 'drawer' | 'popover' | 'listbox' | 'listbackdrop' | 'menu' | 'backdrop' | 'handles' | 'dropline' | 'label' | 'marquee' | 'guide' | 'tools'

export const LAYER_SHAPES: { id: LayerShape; label: string; hint: string }[] = [
  { id: 'dialog', label: '창', hint: '화면을 가리는 막과 그 위의 창' },
  { id: 'toast', label: '알림', hint: '화면 아래에 잠깐 뜨는 알림' },
  // 여느 서비스의 화면에 흔한 것들. 아래의 색 고르는 창부터는 FF 같은 편집 도구의 요소다.
  { id: 'sticky', label: '붙는 머리', hint: '스크롤해도 화면 위에 붙어 있는 머리' },
  { id: 'tooltip', label: '도움말', hint: '마우스를 올리면 뜨는 도움말' },
  { id: 'drawer', label: '서랍', hint: '옆에서 나와 화면을 덮는 면' },
  { id: 'popover', label: '색 고르는 창', hint: '창 위에 뜨는 색 고르는 창' },
  { id: 'listbox', label: '목록', hint: '고르는 칸에서 펼쳐지는 목록' },
  { id: 'listbackdrop', label: '목록 바깥 면', hint: '목록이 열린 동안 화면을 덮는 면' },
  { id: 'menu', label: '메뉴', hint: '상단 바에서 펼쳐지는 메뉴' },
  { id: 'backdrop', label: '바깥 면', hint: '메뉴가 열린 동안 화면을 덮는 면' },
  { id: 'handles', label: '꼭짓점', hint: '선택한 것의 꼭짓점 사각형' },
  { id: 'dropline', label: '놓일 자리', hint: '끌어 놓을 자리의 선' },
  { id: 'label', label: '선택 이름표', hint: '선택한 것 아래의 이름표' },
  { id: 'marquee', label: '영역 선택', hint: '캔버스에서 끌어 그리는 상자' },
  { id: 'guide', label: '안내선', hint: '판을 끌 때의 맞춤 선과 거리' },
  { id: 'tools', label: '확대 도구', hint: '캔버스 오른쪽 아래의 도구' },
]

/**
 * 추가 창에서 분류마다 처음 골라 두는 예시의 모양. 그 분류에서 가장 흔한 쓰임이다. 직접 고르기 전까지만 분류를 따라 바뀐다.
 * 화면 위는 화면을 가리는 막과 창, 요소 위는 선택한 것 아래의 이름표다.
 */
export const LAYER_SHAPE_FOR: Record<LayerGroup, LayerShape> = { app: 'dialog', item: 'label', other: 'dialog' }

/** 모양마다의 기본 예시 문구. 모든 모양이 ", "로 나눠 적는다(창은 제목·이름표·버튼들, 색 선택 창은 창의 제목·이름표·색 값·버튼들, 목록과 목록 바깥 면은 창의 제목·칸의 이름표·줄들, 메뉴와 바깥 면은 버튼의 말과 줄들). */
export const LAYER_WORDS: Record<LayerShape, string> = {
  dialog: '삭제할까요?, 이름, 취소, 삭제',
  toast: '저장했어요',
  sticky: '주문 내역',
  tooltip: '복사, 코드',
  drawer: '필터, 첫째, 둘째, 셋째',
  popover: '색 추가, 색, #3b82f6, 취소, 추가',
  listbox: '고르기, 종류, 첫째, 둘째, 셋째',
  listbackdrop: '고르기, 종류, 첫째, 둘째, 셋째',
  menu: '프로젝트, 첫째, 둘째',
  backdrop: '프로젝트, 첫째, 둘째',
  handles: '첫째, 둘째, 셋째',
  dropline: '첫째, 둘째, 셋째',
  label: '첫째 · 값, 둘째, 셋째',
  marquee: '첫째, 둘째',
  guide: '24, 첫째, 둘째',
  tools: '100%',
}

/** 예시 하나. 어떤 요소로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type LayerExample = { shape: LayerShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const LABELS = LAYER_SHAPES.map((s) => s.label)
  // 긴 이름을 먼저 견준다("색 선택 창"이 "창"으로 읽히지 않게).
  .sort((a, b) => b.length - a.length)
  .join('|')
const GROUP_LABELS = LAYER_GROUPS.map((g) => g.label).join('|')
const own = (label: string) => LAYER_SHAPES.find((s) => s.label === label)?.id

/**
 * 주석에서 분류와 설명과 예시들을 읽는다. "화면 위(창): 화면을 가리는 막과 그 위의 창 | 의미 색 추가, 이름, 취소, 추가"처럼 분류 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * group은 분류(적혀 있지 않으면 이름에서 짐작한 것). picked는 주석에 직접 적혀 있던 첫 예시의 모양이다. examples는 판에 그릴 예시들이고, 모양을 적지 않은 값은 예시가 없다.
 */
export function readLayerNote(
  note: string | undefined,
  short: string,
): { group: LayerGroup; text: string; picked?: LayerShape; words: string; more: LayerExample[]; examples: LayerExample[] } {
  const all = (note ?? '').trim()
  const m = new RegExp(`^(${GROUP_LABELS})(?:\\(([^)|]*)\\))?\\s*:\\s*(.*)$`).exec(all)
  const group = m ? (LAYER_GROUPS.find((g) => g.label === m[1])?.id ?? guessLayerGroup(short)) : (groupFromNote(all, LAYER_GROUPS, 'other') ?? guessLayerGroup(short))
  const picked = m?.[2] ? own(m[2]) : undefined
  // 목록에 없는 분류의 주석(이름(모양): …)도 " | "로 나눠 읽는다. 통째로 설명으로 읽으면 다시 적을 때 문구의 구분이 사라진다.
  const parts = m ? m[3].split(MARK).map((p) => p.trim()) : headOf(all) !== null ? all.split(MARK).map((p) => p.trim()) : [all]
  const words = parts[1] ?? ''
  const head = new RegExp(`^(${LABELS})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).flatMap((p): LayerExample[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { group, text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 분류는 언제나 적고, 첫 예시의 모양은 주석에 적혀 있던 것만 적는다. */
export function writeLayerNote(group: LayerGroup, text: string, shape?: LayerShape, words = '', more: LayerExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: LayerShape) => LAYER_SHAPES.find((s) => s.id === id)!.label
  const groupLabel = LAYER_GROUPS.find((g) => g.id === group)!.label
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
export const LAYER_NAMES: Record<LayerShape, string> = {
  dialog: 'dialog',
  toast: 'toast',
  sticky: 'sticky',
  tooltip: 'tooltip',
  drawer: 'drawer',
  popover: 'popover',
  listbox: 'listbox',
  listbackdrop: 'listbox-backdrop',
  menu: 'menu',
  backdrop: 'menu-backdrop',
  handles: 'handle',
  dropline: 'drop-line',
  label: 'callout',
  marquee: 'marquee',
  guide: 'guide',
  tools: 'tools',
}
