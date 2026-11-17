// 간격: 설명과 예시를 주석에서 읽고 쓰는 것.
// 간격에는 의미 판을 따로 두지 않는다. 값이 다섯 개 안팎이라 재료와 쓰임을 두 층으로 나누면 판과 클래스만 늘어난다.
// 그래서 간격 판의 값마다 어디에 쓰는지를 설명과 예시로 값 뒤의 주석에 적는다(효과 판과 같은 방식).
//   --spacing-2: 8px; /* 간격(사이): 버튼 사이, 입력칸의 좌우 여백 | 취소, 추가 | 입력칸: float */

/** 주석 맨 앞에 적는 종류의 이름. */
export const SPACE_TITLE = '간격'

/**
 * 예시의 모양. 그 간격이 어디에 놓였는지다.
 * 여백은 "좌우 여백", "안쪽 여백"처럼 방향으로 나누지 않고 무엇의 여백인지로 나눈다(버튼, 입력칸, 면). 방향만으로는 그림이 무엇인지 알 수 없다.
 */
export type SpaceShape = 'gap' | 'stack' | 'label' | 'rows' | 'fields' | 'groups' | 'button' | 'input' | 'surface' | 'surfacex'

export const SPACE_SHAPES: { id: SpaceShape; label: string; hint: string }[] = [
  { id: 'gap', label: '사이', hint: '나란히 놓인 버튼들 사이' },
  { id: 'stack', label: '쌓임', hint: '위아래로 놓인 글자 줄 사이' },
  { id: 'label', label: '이름표', hint: '이름표와 그 아래 입력칸 사이' },
  { id: 'rows', label: '줄', hint: '목록의 줄과 줄 사이' },
  { id: 'fields', label: '칸', hint: '이름표가 붙은 입력칸들 사이' },
  { id: 'groups', label: '묶음', hint: '제목이 붙은 묶음들 사이' },
  { id: 'button', label: '버튼', hint: '버튼의 왼쪽과 오른쪽 여백' },
  { id: 'input', label: '입력칸', hint: '입력칸의 왼쪽과 오른쪽 여백' },
  { id: 'surface', label: '면', hint: '패널, 창, 카드의 네 가장자리 여백' },
  { id: 'surfacex', label: '면 좌우', hint: '패널, 창, 카드의 왼쪽과 오른쪽 여백' },
]

/** 모양마다의 기본 예시 문구. 사이와 쌓임은 ", "로 나눠 하나씩 놓는다. */
export const SPACE_WORDS: Record<SpaceShape, string> = {
  gap: '취소, 추가',
  stack: '이름, 값',
  label: '이름, 값',
  rows: '첫째, 둘째',
  fields: '이름, 값',
  groups: '첫째, 둘째',
  button: '추가',
  input: '값',
  surface: '제목',
  surfacex: '제목',
}

/** 여럿을 늘어놓는 모양인지. 문구를 ", "로 나눈다. */
export const isSpaceListShape = (shape: SpaceShape) => ['gap', 'stack', 'label', 'rows', 'fields', 'groups'].includes(shape)

/** 예시 하나. 어떤 자리에 놓을지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type SpaceExample = { shape: SpaceShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const LABELS = SPACE_SHAPES.map((s) => s.label).join('|')
const own = (label: string) => SPACE_SHAPES.find((s) => s.label === label)?.id

/**
 * 주석에서 설명과 예시들을 읽는다. "간격(사이): 버튼 사이 | 취소, 추가 | 버튼: 추가"처럼 "간격"으로 시작하지 않으면 주석 전체가 설명이다.
 * shape는 첫 예시를 그릴 모양이고, picked는 주석에 직접 적혀 있던 모양이다(없으면 undefined. 그때 shape는 사이다).
 */
export function readSpaceNote(note: string | undefined): { text: string; shape: SpaceShape; picked?: SpaceShape; words: string; more: SpaceExample[] } {
  const all = (note ?? '').trim()
  const m = new RegExp(`^${SPACE_TITLE}(?:\\((${LABELS})\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[1] ? own(m[1]) : undefined
  const shape = picked ?? 'gap'
  const parts = m ? m[2].split(MARK).map((p) => p.trim()) : [all]
  const head = new RegExp(`^(${LABELS})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).map((p): SpaceExample => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? { shape: id, words: h![2].trim() } : { shape, words: p }
  })
  return { text: parts[0], shape, ...(picked ? { picked } : {}), words: parts[1] ?? '', more }
}

/** 주석에 적을 글자. 첫 예시의 모양은 직접 고른 것만 적는다. 설명도 예시도 없으면 빈 글자(주석을 달지 않는다). */
export function writeSpaceNote(text: string, shape?: SpaceShape, words = '', more: SpaceExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: SpaceShape) => SPACE_SHAPES.find((s) => s.id === id)!.label
  const clean = tidy(text)
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  const body = [clean, ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  if (!body && !shape) return ''
  const head = shape ? `${SPACE_TITLE}(${label(shape)})` : SPACE_TITLE
  return body ? `${head}: ${body}` : `${head}:`
}
