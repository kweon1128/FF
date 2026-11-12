// 기본 값의 종류와 화면 구성.
// 변수 이름의 앞부분은 Tailwind v4의 규칙을 따른다(--color-*, --text-*, --radius-* 등).

export type PreviewType =
  | 'color'
  | 'font'
  | 'size'
  | 'weight'
  | 'leading'
  | 'tracking'
  | 'space'
  | 'radius'
  | 'border'
  | 'shadow'
  | 'opacity'
  | 'blur'
  | 'breakpoint'
  | 'container'
  | 'aspect'
  | 'z'
  | 'duration'
  | 'ease'

export type Kind = {
  id: PreviewType
  title: string
  prefix: string
  matches: (name: string) => boolean
  defaultValue: string
  addLabel: string
  valueLabel: string
  emptyTitle: string
  /** 줄 목록 대신 네모 칸 격자로 보여 준다. */
  tiles?: boolean
}

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const starts = (prefix: string) => (n: string) => n.startsWith(prefix)

const color: Kind = {
  id: 'color',
  title: '색상',
  prefix: '--color-',
  matches: starts('--color-'),
  defaultValue: '#888888',
  addLabel: '색 추가',
  valueLabel: '색 값',
  emptyTitle: '첫 색 목록을 만들어 보세요',
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
}

const weight: Kind = {
  id: 'weight',
  title: '굵기',
  prefix: '--font-weight-',
  matches: starts('--font-weight-'),
  defaultValue: '400',
  addLabel: '굵기 추가',
  valueLabel: '굵기',
  emptyTitle: '굵기가 아직 없어요',
}

const leading: Kind = {
  id: 'leading',
  title: '줄 높이',
  prefix: '--leading-',
  matches: starts('--leading-'),
  defaultValue: '1.5',
  addLabel: '줄 높이 추가',
  valueLabel: '줄 높이',
  emptyTitle: '줄 높이가 아직 없어요',
}

const tracking: Kind = {
  id: 'tracking',
  title: '글자 사이',
  prefix: '--tracking-',
  matches: starts('--tracking-'),
  defaultValue: '0em',
  addLabel: '글자 사이 추가',
  valueLabel: '글자 사이 간격',
  emptyTitle: '글자 사이 값이 아직 없어요',
}

const space: Kind = {
  id: 'space',
  title: '간격',
  prefix: '--spacing-',
  matches: starts('--spacing-'),
  defaultValue: '16px',
  addLabel: '간격 추가',
  valueLabel: '길이',
  emptyTitle: '첫 간격을 추가해 보세요',
}

const radius: Kind = {
  id: 'radius',
  title: '모서리',
  prefix: '--radius-',
  matches: starts('--radius-'),
  defaultValue: '8px',
  addLabel: '모서리 추가',
  valueLabel: '둥글기',
  emptyTitle: '첫 모서리 값을 추가해 보세요',
  tiles: true,
}

const border: Kind = {
  id: 'border',
  title: '테두리 굵기',
  prefix: '--border-width-',
  matches: starts('--border-width-'),
  defaultValue: '1px',
  addLabel: '테두리 굵기 추가',
  valueLabel: '굵기',
  emptyTitle: '첫 테두리 굵기를 추가해 보세요',
}

const shadow: Kind = {
  id: 'shadow',
  title: '그림자',
  prefix: '--shadow-',
  matches: starts('--shadow-'),
  defaultValue: '0 4px 16px rgb(0 0 0 / 0.12)',
  addLabel: '그림자 추가',
  valueLabel: '그림자',
  emptyTitle: '그림자가 아직 없어요',
  tiles: true,
}

const opacity: Kind = {
  id: 'opacity',
  title: '투명도',
  prefix: '--opacity-',
  matches: starts('--opacity-'),
  defaultValue: '0.5',
  addLabel: '투명도 추가',
  valueLabel: '투명도 (0~1)',
  emptyTitle: '투명도가 아직 없어요',
  tiles: true,
}

const blur: Kind = {
  id: 'blur',
  title: '흐림',
  prefix: '--blur-',
  matches: starts('--blur-'),
  defaultValue: '8px',
  addLabel: '흐림 추가',
  valueLabel: '흐림 정도',
  emptyTitle: '흐림 값이 아직 없어요',
  tiles: true,
}

const breakpoint: Kind = {
  id: 'breakpoint',
  title: '화면 폭 기준',
  prefix: '--breakpoint-',
  matches: starts('--breakpoint-'),
  defaultValue: '768px',
  addLabel: '화면 폭 기준 추가',
  valueLabel: '폭',
  emptyTitle: '화면 폭 기준이 아직 없어요',
}

const container: Kind = {
  id: 'container',
  title: '최대 너비',
  prefix: '--container-',
  matches: starts('--container-'),
  defaultValue: '960px',
  addLabel: '최대 너비 추가',
  valueLabel: '너비',
  emptyTitle: '최대 너비가 아직 없어요',
}

const aspect: Kind = {
  id: 'aspect',
  title: '비율',
  prefix: '--aspect-',
  matches: starts('--aspect-'),
  defaultValue: '16 / 9',
  addLabel: '비율 추가',
  valueLabel: '가로 / 세로',
  emptyTitle: '비율이 아직 없어요',
  tiles: true,
}

const z: Kind = {
  id: 'z',
  title: '겹치는 순서',
  prefix: '--z-',
  matches: starts('--z-'),
  defaultValue: '10',
  addLabel: '겹치는 순서 추가',
  valueLabel: '순서 (클수록 위)',
  emptyTitle: '겹치는 순서가 아직 없어요',
}

const duration: Kind = {
  id: 'duration',
  title: '움직임 시간',
  prefix: '--duration-',
  matches: starts('--duration-'),
  defaultValue: '200ms',
  addLabel: '움직임 시간 추가',
  valueLabel: '시간',
  emptyTitle: '움직임 시간이 아직 없어요',
}

const ease: Kind = {
  id: 'ease',
  title: '움직임 흐름',
  prefix: '--ease-',
  matches: starts('--ease-'),
  defaultValue: 'cubic-bezier(0.4, 0, 0.2, 1)',
  addLabel: '움직임 흐름 추가',
  valueLabel: '속도 곡선',
  emptyTitle: '움직임 흐름이 아직 없어요',
}

export const KINDS = {
  color,
  font,
  size,
  weight,
  leading,
  tracking,
  space,
  radius,
  border,
  shadow,
  opacity,
  blur,
  breakpoint,
  container,
  aspect,
  z,
  duration,
  ease,
}

export const ALL_KINDS: Kind[] = Object.values(KINDS)

export type TokenScreenId = 'color' | 'type' | 'spacing' | 'radius' | 'border' | 'effect' | 'layout' | 'motion'
export type PlaceholderScreenId = 'layouts' | 'assets'
export type ScreenId = 'canvas' | 'components' | TokenScreenId | PlaceholderScreenId

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
  type: { title: '글꼴', kinds: [font, size, weight, leading, tracking] },
  spacing: { title: '간격', kinds: [space] },
  radius: { title: '모서리', kinds: [radius] },
  border: { title: '테두리', kinds: [border] },
  effect: { title: '효과', kinds: [shadow, opacity, blur] },
  layout: { title: '화면 크기', kinds: [breakpoint, container, aspect, z] },
  motion: { title: '움직임', kinds: [duration, ease] },
}

export const PLACEHOLDER_SCREENS: Record<PlaceholderScreenId, { title: string }> = {
  layouts: { title: '화면 구조' },
  assets: { title: '아이콘·이미지' },
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
