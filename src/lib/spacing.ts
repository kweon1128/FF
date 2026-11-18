// 의미 간격: 묶음과 설명과 예시를 주석에서 읽고 쓰는 것.
// 간격에는 토대(숫자 이름의 값: --spacing-2: 8px)와 의미(쓰임 이름: --spacing-actions: var(--spacing-2))가 있다.
// 한 값을 여러 쓰임이 나눠 쓰므로, 쓰임마다 이름을 두어야 쓰임 하나만 따로 바꿀 수 있다.
// 의미 간격의 묶음과 설명, 예시는 값 뒤의 주석에 적는다(의미 색, 의미 글꼴과 같은 방식).
//   --spacing-actions: var(--spacing-2); /* 버튼(사이): 나란한 버튼 사이 | 취소, 추가 */

/** 의미 간격의 묶음. 무엇에 딸린 간격인지다. 판은 이 차례로 묶어 보여 준다. */
export type SpaceUse = 'button' | 'input' | 'list' | 'board' | 'panel' | 'dialog'

export const SPACE_USES: { id: SpaceUse; label: string; hint: string }[] = [
  { id: 'button', label: '버튼', hint: '버튼의 여백, 버튼 사이' },
  { id: 'input', label: '입력칸', hint: '입력칸의 여백, 이름표, 칸 사이' },
  { id: 'list', label: '목록', hint: '메뉴와 목록의 줄' },
  { id: 'board', label: '판', hint: '판의 여백, 묶음, 격자' },
  { id: 'panel', label: '패널', hint: '패널의 구역과 그 안' },
  { id: 'dialog', label: '창', hint: '창과 떠 있는 것의 여백' },
]

/** 묶음을 적지 않은 값의 묶음. 이름에서 짐작하고, 짐작할 수 없으면 판이다. */
export function guessSpaceUse(short: string): SpaceUse {
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  if (has('button', 'actions', 'btn')) return 'button'
  if (has('input', 'label', 'field', 'fields', 'chip', 'settings', 'form')) return 'input'
  if (has('row', 'rows', 'menu', 'nav', 'list', 'item')) return 'list'
  if (has('section', 'blocks', 'panel', 'sidebar')) return 'panel'
  if (has('dialog', 'modal', 'popover', 'bar', 'toast', 'sheet')) return 'dialog'
  return 'board'
}

/**
 * 예시의 모양. 그 간격이 어디에 놓였는지다.
 * 여백은 "좌우 여백", "안쪽 여백"처럼 방향으로 나누지 않고 무엇의 여백인지로 나눈다(버튼, 입력칸, 면). 방향만으로는 그림이 무엇인지 알 수 없다.
 */
export type SpaceShape = 'gap' | 'icon' | 'stack' | 'label' | 'rows' | 'fields' | 'groups' | 'button' | 'filled' | 'ghost' | 'ghosts' | 'rowicon' | 'row' | 'rowy' | 'menu' | 'input' | 'unit' | 'inputs' | 'chip' | 'heading' | 'cols' | 'grid' | 'gridy' | 'box' | 'footer' | 'bar' | 'surface' | 'surfacex' | 'surfacey'

export const SPACE_SHAPES: { id: SpaceShape; label: string; hint: string }[] = [
  { id: 'gap', label: '사이', hint: '나란히 놓인 버튼들 사이' },
  { id: 'icon', label: '아이콘', hint: '아이콘과 그 옆 글자 사이' },
  { id: 'stack', label: '쌓임', hint: '위아래로 놓인 글자 줄 사이' },
  { id: 'label', label: '이름표', hint: '이름표와 그 아래 입력칸 사이' },
  { id: 'rows', label: '줄', hint: '목록의 줄과 줄 사이' },
  { id: 'fields', label: '칸', hint: '이름표가 붙은 입력칸들 사이' },
  { id: 'groups', label: '묶음', hint: '제목이 붙은 묶음들 사이' },
  { id: 'button', label: '버튼', hint: '테두리 버튼의 왼쪽과 오른쪽 여백' },
  { id: 'filled', label: '채운 버튼', hint: '채운 버튼의 왼쪽과 오른쪽 여백' },
  { id: 'ghost', label: '바탕 없는 버튼', hint: '바탕 없는 버튼의 왼쪽과 오른쪽 여백' },
  { id: 'ghosts', label: '바탕 없는 버튼 사이', hint: '나란한 바탕 없는 버튼들 사이' },
  { id: 'rowicon', label: '줄 아이콘', hint: '메뉴 줄 안의 아이콘과 글자 사이' },
  { id: 'row', label: '줄 좌우', hint: '메뉴 줄의 왼쪽과 오른쪽 여백' },
  { id: 'rowy', label: '줄 위아래', hint: '줄의 위와 아래 여백' },
  { id: 'menu', label: '목록 상자', hint: '줄들을 담은 상자의 네 가장자리 여백' },
  { id: 'unit', label: '단위', hint: '입력칸 안의 값과 단위 사이' },
  { id: 'inputs', label: '나란한 칸', hint: '가로로 나란한 입력칸들 사이' },
  { id: 'chip', label: '칩', hint: '칩의 왼쪽과 오른쪽 여백' },
  { id: 'heading', label: '제목과 내용', hint: '제목과 그 아래 내용 사이' },
  { id: 'cols', label: '열 사이', hint: '한 줄 안의 이름 칸과 옆 칸 사이' },
  { id: 'grid', label: '격자', hint: '격자의 칸과 칸 사이' },
  { id: 'gridy', label: '격자 줄', hint: '격자의 줄과 줄 사이' },
  { id: 'box', label: '상자', hint: '판, 카드, 작은 창의 네 가장자리 여백' },
  { id: 'footer', label: '버튼 줄', hint: '창의 내용과 아래 버튼 줄 사이' },
  { id: 'bar', label: '막대 좌우', hint: '상단 바, 알림의 왼쪽과 오른쪽 여백' },
  { id: 'input', label: '입력칸', hint: '입력칸의 왼쪽과 오른쪽 여백' },
  { id: 'surface', label: '면', hint: '패널, 창, 카드의 네 가장자리 여백' },
  { id: 'surfacex', label: '면 좌우', hint: '패널, 창, 카드의 왼쪽과 오른쪽 여백' },
  { id: 'surfacey', label: '면 위아래', hint: '패널 구역의 위와 아래 여백' },
]

/** 모양마다의 기본 예시 문구. 사이와 쌓임은 ", "로 나눠 하나씩 놓는다. */
export const SPACE_WORDS: Record<SpaceShape, string> = {
  gap: '취소, 추가',
  icon: '추가',
  stack: '이름, 값',
  label: '이름, 값',
  rows: '첫째, 둘째',
  fields: '이름, 값',
  groups: '첫째, 둘째',
  button: '취소',
  filled: '추가',
  ghost: '원래대로',
  rowicon: '색상',
  ghosts: '원래대로, 접기',
  row: '색상',
  rowy: '색상',
  menu: '첫째, 둘째',
  unit: '12, px',
  inputs: '값, 값',
  chip: '이름',
  heading: '제목',
  cols: '이름',
  grid: '',
  gridy: '',
  box: '',
  footer: '취소, 추가',
  bar: '제목',
  surfacey: '제목',
  input: '값',
  surface: '제목',
  surfacex: '제목',
}

/** 여럿을 늘어놓는 모양인지. 문구를 ", "로 나눈다. */
export const isSpaceListShape = (shape: SpaceShape) => ['gap', 'stack', 'label', 'rows', 'fields', 'groups', 'ghosts', 'menu', 'unit', 'inputs', 'footer'].includes(shape)

/** 예시 하나. 어떤 자리에 놓을지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type SpaceExample = { shape: SpaceShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const LABELS = SPACE_SHAPES.map((s) => s.label).join('|')
const USE_LABELS = SPACE_USES.map((u) => u.label).join('|')
const own = (label: string) => SPACE_SHAPES.find((s) => s.label === label)?.id

/**
 * 주석에서 묶음과 설명과 예시들을 읽는다. "버튼(사이): 나란한 버튼 사이 | 취소, 추가 | 버튼: 추가"처럼 묶음 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * use는 묶음(적혀 있지 않으면 이름에서 짐작한 것). picked는 주석에 직접 적혀 있던 첫 예시의 모양이다.
 * examples는 판에 그릴 예시들이다. 모양도 문구도 적지 않은 값은 예시가 없다(짐작으로 그리지 않는다. 간격은 이름만으로 그림을 정할 수 없다).
 */
export function readSpaceNote(
  note: string | undefined,
  short: string,
): { use: SpaceUse; text: string; picked?: SpaceShape; words: string; more: SpaceExample[]; examples: SpaceExample[] } {
  const all = (note ?? '').trim()
  const m = new RegExp(`^(${USE_LABELS})(?:\\((${LABELS})\\))?\\s*:\\s*(.*)$`).exec(all)
  const use = (m && SPACE_USES.find((u) => u.label === m[1])?.id) || guessSpaceUse(short)
  const picked = m?.[2] ? own(m[2]) : undefined
  const parts = m ? m[3].split(MARK).map((p) => p.trim()) : [all]
  const words = parts[1] ?? ''
  const head = new RegExp(`^(${LABELS})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).flatMap((p): SpaceExample[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { use, text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 묶음은 언제나 적고, 첫 예시의 모양은 직접 고른 것만 적는다. */
export function writeSpaceNote(use: SpaceUse, text: string, shape?: SpaceShape, words = '', more: SpaceExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: SpaceShape) => SPACE_SHAPES.find((s) => s.id === id)!.label
  const useLabel = SPACE_USES.find((u) => u.id === use)!.label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  const head = shape ? `${useLabel}(${label(shape)})` : useLabel
  return body ? `${head}: ${body}` : `${head}:`
}
