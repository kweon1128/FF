// 기본 값의 종류와 화면 구성.
// 변수 이름의 앞부분은 Tailwind v4의 규칙을 따른다(--color-*, --text-*, --radius-* 등).

export type PreviewType =
  | 'color'
  | 'role'
  | 'font'
  | 'style'
  | 'size'
  | 'weight'
  | 'leading'
  | 'tracking'
  | 'space'
  | 'spaceuse'
  | 'length'
  | 'height'
  | 'width'
  | 'square'
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
  /** 줄 목록 대신 네모 칸 격자로 보여 준다. */
  tiles?: boolean
  /** 이제 쓰지 않는 종류. 파일에 그 값이 있을 때만 보여 주고, 새로 추가하지는 못한다. */
  legacy?: boolean
}

/**
 * 글자 크기에 묶인 줄 높이의 변수 이름. --text-sm의 줄 높이는 --text-sm--line-height다(Tailwind의 규칙).
 * 이렇게 묶어 두면 text-sm만 써도 줄 높이가 함께 따라온다.
 */
export const lineName = (sizeName: string) => `${sizeName}--line-height`
/** 글자 크기에 묶인 글자 사이(자간)의 변수 이름. --text-xl의 글자 사이는 --text-xl--letter-spacing이다(Tailwind의 규칙). */
export const trackName = (sizeName: string) => `${sizeName}--letter-spacing`
/** 글자 크기에 묶여 함께 다니는 값들의 이름. 크기의 이름을 바꾸거나 복제하거나 지우면 이 값들도 따라간다. */
export const boundNames = (sizeName: string) => [lineName(sizeName), trackName(sizeName)]

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const starts = (prefix: string) => (n: string) => n.startsWith(prefix)

/** 다른 색을 가리키는 값. var(--color-blue-600)처럼 색 변수 하나를 그대로 가리킨다. */
export const COLOR_REF = /^var\(\s*(--color-[a-z0-9-]+)\s*\)$/

/**
 * 의미 색의 이름들. 의미 색과 단계 색은 이름이 똑같이 --color-로 시작해서 이름만으로는 가릴 수 없고,
 * 값이 다른 색을 가리키는지로 가린다. 값 목록이 바뀔 때마다 App이 markRoles로 다시 알려 준다.
 */
const roleNames = new Set<string>()

/**
 * 간격 판의 값을 가리키는 값. var(--gutter-8)처럼 간격 변수 하나를 그대로 가리킨다. 의미 간격의 값이 이 꼴이다.
 * 예전 파일은 var(--spacing-2)처럼 예전 이름의 간격을 가리킨다. 그것도 읽는다.
 */
export const SPACE_REF = /^var\(\s*(--(?:gutter|spacing)-[a-z0-9-]+)\s*\)$/
/** 크기 판의 값을 가리키는 값. var(--length-32)처럼 크기 변수 하나를 그대로 가리킨다. 의미 크기(높이, 폭, 정사각)의 값이 이 꼴이다. */
export const LENGTH_REF = /^var\(\s*(--length-[a-z0-9-]+)\s*\)$/
/**
 * 예전 방식의 토대 간격의 이름들(--spacing-2: 8px). 지금은 토대가 --gutter-8, 의미가 --spacing-이름이라 앞머리로 가려지지만,
 * 예전 파일에는 --spacing-으로 시작하면서 길이를 직접 적은 값이 남아 있을 수 있다. 그런 값은 의미 간격이 아니라 간격 판(토대)에 보여 준다.
 * 이름만으로는 가릴 수 없어서 값이 다른 간격을 가리키는지로 가린다. 값 목록이 바뀔 때마다 App이 markRoles로 다시 알려 준다.
 */
const legacySpaceNames = new Set<string>()

export function markRoles(tokens: { name: string; value: string }[]) {
  roleNames.clear()
  legacySpaceNames.clear()
  for (const t of tokens) if (t.name.startsWith('--spacing-') && !SPACE_REF.test(t.value)) legacySpaceNames.add(t.name)
  for (const t of tokens) if (t.name.startsWith('--color-') && COLOR_REF.test(t.value)) roleNames.add(t.name)
}

const color: Kind = {
  id: 'color',
  title: '색상',
  prefix: '--color-',
  matches: (n) => n.startsWith('--color-') && !roleNames.has(n),
  defaultValue: '#888888',
  addLabel: '색 추가',
  valueLabel: '색 값',
}

/** 의미 색. 실제로 쓰는 색에 쓰임새의 이름을 붙인 것으로, 색상 판의 색 하나를 가리킨다. */
const role: Kind = {
  id: 'role',
  title: '의미 색',
  prefix: '--color-',
  matches: (n) => roleNames.has(n),
  defaultValue: '',
  addLabel: '의미 색 추가',
  valueLabel: '가리키는 색',
}

const font: Kind = {
  id: 'font',
  title: '글꼴 종류',
  prefix: '--font-',
  matches: (n) => n.startsWith('--font-') && !n.startsWith('--font-weight-'),
  defaultValue: 'system-ui, sans-serif',
  addLabel: '글꼴 종류 추가',
  valueLabel: '글꼴 이름',
}

const size: Kind = {
  id: 'size',
  title: '글자 크기',
  prefix: '--text-',
  matches: (n) => n.startsWith('--text-') && !n.slice('--text-'.length).includes('--'),
  defaultValue: '16px',
  // 크기 판의 "크기 추가"와 겹치지 않게 종류의 이름을 그대로 붙인다.
  addLabel: '글자 크기 추가',
  valueLabel: '크기',
}

const weight: Kind = {
  id: 'weight',
  title: '굵기',
  prefix: '--font-weight-',
  matches: starts('--font-weight-'),
  defaultValue: '400',
  addLabel: '굵기 추가',
  valueLabel: '굵기',
}

/**
 * 의미 글꼴. 글꼴 종류, 글자 크기, 굵기 가운데 실제로 쓰는 조합에 쓰임새의 이름을 붙인 것.
 * 값은 CSS의 font 한 줄(굵기 크기/줄 높이 글꼴)이고, 뒤에 붙는 글자 사이(--type-이름--letter-spacing)는 이 종류에 들지 않는다.
 */
const style: Kind = {
  id: 'style',
  title: '의미 글꼴',
  prefix: '--type-',
  matches: (n) => n.startsWith('--type-') && !n.slice('--type-'.length).includes('--'),
  defaultValue: '',
  addLabel: '의미 글꼴 추가',
  valueLabel: '조합',
}

const leading: Kind = {
  id: 'leading',
  title: '줄 높이',
  prefix: '--leading-',
  matches: starts('--leading-'),
  // 줄 높이는 글자 크기에 묶어 px로 정한다. 따로 떨어진 줄 높이 목록은 예전 파일에 남아 있을 때만 보인다.
  legacy: true,
  defaultValue: '24px',
  addLabel: '줄 높이 추가',
  valueLabel: '줄 높이',
}

const tracking: Kind = {
  id: 'tracking',
  title: '글자 사이',
  prefix: '--tracking-',
  matches: starts('--tracking-'),
  // 글자 사이(자간)도 줄 높이처럼 글자 크기에 묶어 정한다. 따로 떨어진 목록은 예전 파일에 남아 있을 때만 보인다.
  legacy: true,
  defaultValue: '0em',
  addLabel: '글자 사이 추가',
  valueLabel: '글자 사이 간격',
}

/**
 * 간격(토대). 길이 그 자체다. 이름은 px 숫자 그대로이고(--gutter-8: 8px), 의미 간격이 이것을 가리킨다. 크기(--length-32)와 같은 짜임이다.
 * 앞머리는 Tailwind가 모르는 --gutter-다. 예전에는 --spacing-2: 8px처럼 "이름 × 4 = 값"으로 적었다. 그러면 4의 배수가 아닌 값(6px, 10px)은 이름을 지을 수 없고,
 * Tailwind의 숫자 클래스(top-2, h-8)가 그 값을 따라가서 간격 하나를 고치면 숫자로 적어 둔 자리가 말없이 함께 바뀐다.
 * 예전 파일에 남아 있는 --spacing-2: 8px 같은 값도 이 종류로 보여 준다(shortName이 spacing-2로 적는다). 그 값의 길이를 고치면 새 이름으로 옮겨진다.
 */
const space: Kind = {
  id: 'space',
  title: '간격',
  prefix: '--gutter-',
  matches: (n) => n.startsWith('--gutter-') || legacySpaceNames.has(n),
  defaultValue: '16px',
  addLabel: '간격 추가',
  valueLabel: '길이',
}

/** 의미 간격. 실제로 쓰는 간격에 쓰임새의 이름을 붙인 것으로, 간격 판의 값 하나를 가리킨다(--spacing-actions: var(--gutter-8)). --spacing-으로 시작하는 값은 예전 방식의 토대 간격만 빼고 모두 의미 간격이다. */
const spaceUse: Kind = {
  id: 'spaceuse',
  title: '의미 간격',
  prefix: '--spacing-',
  matches: (n) => n.startsWith('--spacing-') && !legacySpaceNames.has(n),
  defaultValue: '',
  addLabel: '의미 간격 추가',
  valueLabel: '가리키는 간격',
}

/**
 * 크기(토대). 길이 그 자체다. 이름은 px 숫자 그대로이고(--length-32: 32px), 의미 크기가 이것을 가리킨다.
 * 앞머리는 Tailwind가 모르는 --length-다. Tailwind가 아는 이름(--spacing-8, --size-32)이면 숫자 클래스(h-8, size-32)가 그 값을 따라가서,
 * 값을 바꿨을 때 숫자로 적어 둔 자리가 말없이 함께 바뀐다.
 */
const length: Kind = {
  id: 'length',
  title: '크기',
  prefix: '--length-',
  matches: starts('--length-'),
  defaultValue: '16px',
  addLabel: '크기 추가',
  valueLabel: '길이',
}

/**
 * 높이. 의미 크기의 한 종류로, 쓰임의 이름을 붙인 높이다. 크기 판의 값 하나를 가리킨다(--height-control: var(--length-32)).
 * Tailwind는 --height-이름에서 h-이름, min-h-이름, max-h-이름 클래스를 만든다.
 */
const height: Kind = {
  id: 'height',
  title: '높이',
  prefix: '--height-',
  matches: starts('--height-'),
  defaultValue: '',
  addLabel: '높이 추가',
  valueLabel: '가리키는 크기',
}

/**
 * 폭. 의미 크기의 한 종류로, 쓰임의 이름을 붙인 폭이다(--width-panel: var(--length-280)). Tailwind는 w-이름 클래스를 만든다.
 * 최소 폭과 최대 폭은 종류를 따로 두지 않고 같은 이름을 가리켜 쓴다(max-w-(--width-page)).
 */
const width: Kind = {
  id: 'width',
  title: '폭',
  prefix: '--width-',
  matches: starts('--width-'),
  defaultValue: '',
  addLabel: '폭 추가',
  valueLabel: '가리키는 크기',
}

/** 정사각. 의미 크기의 한 종류로, 가로와 세로가 같은 크기다(아이콘 버튼, 아이콘, 색 견본. --size-icon: var(--length-16)). Tailwind는 size-이름 클래스를 만든다. */
const square: Kind = {
  id: 'square',
  title: '정사각',
  prefix: '--size-',
  matches: starts('--size-'),
  defaultValue: '',
  addLabel: '정사각 추가',
  valueLabel: '가리키는 크기',
}

const radius: Kind = {
  id: 'radius',
  title: '모서리',
  prefix: '--radius-',
  matches: starts('--radius-'),
  defaultValue: '8px',
  addLabel: '모서리 추가',
  valueLabel: '둥글기',
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
}

const shadow: Kind = {
  id: 'shadow',
  title: '그림자',
  prefix: '--shadow-',
  matches: starts('--shadow-'),
  defaultValue: '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 16px rgb(0 0 0 / 0.06)',
  addLabel: '그림자 추가',
  valueLabel: '그림자',
}

const opacity: Kind = {
  id: 'opacity',
  title: '투명도',
  prefix: '--opacity-',
  matches: starts('--opacity-'),
  defaultValue: '0.5',
  addLabel: '투명도 추가',
  valueLabel: '투명도 (0~1)',
}

const blur: Kind = {
  id: 'blur',
  title: '흐림',
  prefix: '--blur-',
  matches: starts('--blur-'),
  defaultValue: '8px',
  addLabel: '흐림 추가',
  valueLabel: '흐림 정도',
}

const breakpoint: Kind = {
  id: 'breakpoint',
  title: '화면 폭 기준',
  prefix: '--breakpoint-',
  matches: starts('--breakpoint-'),
  defaultValue: '768px',
  addLabel: '화면 폭 기준 추가',
  valueLabel: '폭',
}

const container: Kind = {
  id: 'container',
  title: '최대 너비',
  prefix: '--container-',
  matches: starts('--container-'),
  defaultValue: '960px',
  addLabel: '최대 너비 추가',
  valueLabel: '너비',
}

const aspect: Kind = {
  id: 'aspect',
  title: '비율',
  prefix: '--aspect-',
  matches: starts('--aspect-'),
  defaultValue: '16 / 9',
  addLabel: '비율 추가',
  valueLabel: '가로 / 세로',
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
}

const duration: Kind = {
  id: 'duration',
  title: '움직임 시간',
  prefix: '--duration-',
  matches: starts('--duration-'),
  defaultValue: '200ms',
  addLabel: '움직임 시간 추가',
  valueLabel: '시간',
}

const ease: Kind = {
  id: 'ease',
  title: '움직임 흐름',
  prefix: '--ease-',
  matches: starts('--ease-'),
  defaultValue: 'cubic-bezier(0.16, 1, 0.3, 1)',
  addLabel: '움직임 흐름 추가',
  valueLabel: '속도 곡선',
}

export const KINDS = {
  color,
  role,
  font,
  size,
  weight,
  style,
  leading,
  tracking,
  space,
  spaceUse,
  length,
  height,
  width,
  square,
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

export type TokenScreenId = 'color' | 'role' | 'style' | 'spaceuse' | 'length' | 'sizeuse' | 'type' | 'spacing' | 'radius' | 'border' | 'effect' | 'layout' | 'motion'
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
  // 나중에 생긴 판이라 맨 뒤에 둔다. 앞의 판들은 순서대로 기본 자리가 정해져 있어서, 사이에 끼우면 모두 밀린다.
  role: { title: '의미 색', kinds: [role] },
  style: { title: '의미 글꼴', kinds: [style] },
  spaceuse: { title: '의미 간격', kinds: [spaceUse] },
  length: { title: '크기', kinds: [length] },
  sizeuse: { title: '의미 크기', kinds: [height, width, square] },
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
/**
 * 토대의 길이(간격 --gutter-8, 크기 --length-32)를 화면에 적는 글자. 이름이 곧 길이라서 8px처럼 길이 한 번만 적는다(8 · 8px처럼 겹쳐 적지 않는다).
 * 줄, 고른 줄의 이름표, 패널의 제목, 고르는 칸, 삭제 경고, 빠른 실행이 모두 이 표기를 쓴다. 숫자 이름이 아닌 값(예전 이름의 간격)은 짧은 이름 그대로다.
 */
export function lengthLabel(kind: Kind, name: string) {
  const short = shortName(kind, name)
  return (kind.id === 'space' || kind.id === 'length') && /^\d+$/.test(short) ? `${short}px` : short
}

export function shortName(kind: Kind, name: string) {
  // 예전 방식의 토대 간격(--spacing-2)은 앞머리가 지금의 것(--gutter-)과 달라서, 예전 이름인 것이 보이게 spacing-2로 적는다.
  return name.startsWith(kind.prefix) ? name.slice(kind.prefix.length) : name.replace(/^--/, '')
}

/** 색 묶음 이름. 예: primary-500 → primary, white → '' */
export function groupOf(short: string) {
  const i = short.lastIndexOf('-')
  return i > 0 ? short.slice(0, i) : ''
}
