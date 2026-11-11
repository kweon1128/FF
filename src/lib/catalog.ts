// 기본 값의 종류와 화면 구성.
// 변수 이름의 앞부분은 Tailwind v4의 규칙을 따른다(--color-*, --text-*, --radius-* 등).

export type PreviewType = 'color' | 'font' | 'size' | 'weight' | 'space' | 'radius'

export type Kind = {
  id: PreviewType
  title: string
  prefix: string
  matches: (name: string) => boolean
  defaultValue: string
  addLabel: string
  valueLabel: string
  emptyTitle: string
  emptyBody: string
}

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const color: Kind = {
  id: 'color',
  title: '색상',
  prefix: '--color-',
  matches: (n) => n.startsWith('--color-'),
  defaultValue: '#888888',
  addLabel: '색 추가',
  valueLabel: '색 값',
  emptyTitle: '첫 색 목록을 만들어 보세요',
  emptyBody: 'primary, gray처럼 목록을 만들고 그 안에 색을 단계별로 추가해요.',
}

const font: Kind = {
  id: 'font',
  title: '글꼴 종류',
  prefix: '--font-',
  matches: (n) => n.startsWith('--font-') && !n.startsWith('--font-weight-'),
  defaultValue: 'system-ui, sans-serif',
  addLabel: '글꼴 추가',
  valueLabel: '글꼴 이름',
  emptyTitle: '글꼴 종류가 아직 없어요',
  emptyBody: '본문용, 제목용처럼 쓰임새별로 추가해 보세요.',
}

const size: Kind = {
  id: 'size',
  title: '글자 크기',
  prefix: '--text-',
  matches: (n) => n.startsWith('--text-') && !n.slice('--text-'.length).includes('--'),
  defaultValue: '16px',
  addLabel: '크기 추가',
  valueLabel: '크기',
  emptyTitle: '글자 크기가 아직 없어요',
  emptyBody: 'sm, base, lg처럼 단계별로 추가해 보세요.',
}

const weight: Kind = {
  id: 'weight',
  title: '굵기',
  prefix: '--font-weight-',
  matches: (n) => n.startsWith('--font-weight-'),
  defaultValue: '400',
  addLabel: '굵기 추가',
  valueLabel: '굵기',
  emptyTitle: '굵기가 아직 없어요',
  emptyBody: 'regular, bold처럼 추가해 보세요.',
}

const space: Kind = {
  id: 'space',
  title: '간격',
  prefix: '--spacing-',
  matches: (n) => n.startsWith('--spacing-'),
  defaultValue: '16px',
  addLabel: '간격 추가',
  valueLabel: '길이',
  emptyTitle: '첫 간격을 추가해 보세요',
  emptyBody: '여백과 사이 간격에 쓸 길이를 단계별로 정해요.',
}

const radius: Kind = {
  id: 'radius',
  title: '모서리',
  prefix: '--radius-',
  matches: (n) => n.startsWith('--radius-'),
  defaultValue: '8px',
  addLabel: '모서리 추가',
  valueLabel: '둥글기',
  emptyTitle: '첫 모서리 값을 추가해 보세요',
  emptyBody: '버튼, 카드 등에 쓸 둥글기를 단계별로 정해요.',
}

export type TokenScreenId = 'color' | 'type' | 'spacing' | 'radius'
export type PlaceholderScreenId = 'components' | 'layouts' | 'assets'
export type ScreenId = 'canvas' | TokenScreenId | PlaceholderScreenId

export const ALL_KINDS: Kind[] = [color, font, size, weight, space, radius]

/** 목록 안에 색을 더할 때의 다음 이름. 100, 200처럼 숫자면 같은 간격으로 이어 간다. */
export function nextStep(steps: string[]) {
  const taken = new Set(steps)
  const nums = steps.map(Number).filter((n) => Number.isFinite(n))
  if (nums.length === 0) {
    let name = taken.has('100') ? 'new' : '100'
    for (let i = 2; taken.has(name); i++) name = `new${i}`
    return name
  }
  const inc = nums.every((n) => n % 100 === 0) ? 100 : nums.every((n) => n % 10 === 0) ? 10 : 1
  let next = Math.max(...nums) + inc
  while (taken.has(String(next))) next += inc
  return String(next)
}

export const TOKEN_SCREENS: Record<TokenScreenId, { title: string; kinds: Kind[] }> = {
  color: { title: '색상', kinds: [color] },
  type: { title: '글꼴', kinds: [font, size, weight] },
  spacing: { title: '간격', kinds: [space] },
  radius: { title: '모서리', kinds: [radius] },
}

export const PLACEHOLDER_SCREENS: Record<PlaceholderScreenId, { title: string; body: string }> = {
  components: { title: '컴포넌트', body: '실제 컴포넌트를 상태별로 보고 옵션을 바꿔보는 화면이에요.' },
  layouts: { title: '화면 구조', body: '블록을 쌓아 페이지 구조를 짜는 화면이에요.' },
  assets: { title: '아이콘·이미지', body: '프로젝트의 아이콘과 이미지를 모아 보는 화면이에요.' },
}

export const TOKEN_SCREEN_IDS = Object.keys(TOKEN_SCREENS) as TokenScreenId[]

export function isTokenScreen(id: ScreenId): id is TokenScreenId {
  return id in TOKEN_SCREENS
}

/** 변수 이름에서 종류 앞부분을 뗀 짧은 이름. 예: --color-primary-500 → primary-500 */
export function shortName(kind: Kind, name: string) {
  return name.slice(kind.prefix.length)
}

/** 색 묶음 이름. 예: primary-500 → primary, white → '' */
export function groupOf(short: string) {
  const i = short.lastIndexOf('-')
  return i > 0 ? short.slice(0, i) : ''
}
