import type { Token } from './api'
import { ALL_KINDS, shortName, type Kind } from './catalog'

/**
 * 값을 추가할 때 생기는 것. 아무 이름(new)과 고정된 값이 아니라, 지금 있는 것 다음에 올 단계가 이름과 값을 갖추고 생긴다.
 * 이름과 값은 Tailwind의 관례를 따른다. AI가 짜는 코드가 이 이름(text-lg, rounded-md 등)을 그대로 쓰기 때문이다.
 */
type Step = [name: string, value: string]
/** steps는 작은 것에서 큰 것 순서. start는 아무것도 없을 때 처음 생기는 단계의 자리(안 주면 맨 앞). */
type Ladder = { steps: Step[]; start?: number }

const px = (pairs: [string, number][]): Step[] => pairs.map(([name, n]) => [name, `${n}px`])

const SCREEN_WIDTHS = px([
  ['sm', 640],
  ['md', 768],
  ['lg', 1024],
  ['xl', 1280],
  ['2xl', 1536],
])

const LADDERS: Partial<Record<Kind['id'], Ladder>> = {
  size: {
    steps: px([
      ['xs', 12],
      ['sm', 14],
      ['base', 16],
      ['lg', 18],
      ['xl', 20],
      ['2xl', 24],
      ['3xl', 30],
      ['4xl', 36],
      ['5xl', 48],
      ['6xl', 60],
    ]),
    start: 2,
  },
  weight: {
    steps: [
      ['light', '300'],
      ['regular', '400'],
      ['medium', '500'],
      ['semibold', '600'],
      ['bold', '700'],
      ['extrabold', '800'],
    ],
    start: 1,
  },
  tracking: {
    steps: [
      ['tighter', '-0.04em'],
      ['tight', '-0.02em'],
      ['normal', '0em'],
      ['wide', '0.02em'],
      ['wider', '0.04em'],
    ],
    start: 2,
  },
  // 간격은 이름이 숫자이고 값은 그 4배(px)다. 1은 4px, 4는 16px.
  space: { steps: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map((n) => [String(n), `${n * 4}px`]) },
  radius: {
    steps: px([
      ['xs', 2],
      ['sm', 4],
      ['md', 8],
      ['lg', 12],
      ['xl', 16],
      ['2xl', 24],
      ['full', 9999],
    ]),
    start: 1,
  },
  border: {
    steps: px([
      ['thin', 1],
      ['thick', 2],
      ['heavy', 4],
    ]),
  },
  shadow: {
    steps: [
      ['sm', '0 1px 2px rgb(0 0 0 / 0.08)'],
      ['md', '0 4px 12px rgb(0 0 0 / 0.1)'],
      ['lg', '0 8px 24px rgb(0 0 0 / 0.12)'],
      ['xl', '0 16px 48px rgb(0 0 0 / 0.16)'],
    ],
  },
  // 투명도는 값이 곧 이름이다. 50은 0.5.
  opacity: { steps: [10, 20, 30, 40, 50, 60, 70, 80, 90].map((n) => [String(n), String(n / 100)]), start: 4 },
  blur: {
    steps: px([
      ['sm', 4],
      ['md', 8],
      ['lg', 16],
      ['xl', 24],
    ]),
  },
  breakpoint: { steps: SCREEN_WIDTHS },
  container: { steps: SCREEN_WIDTHS },
  aspect: {
    steps: [
      ['square', '1 / 1'],
      ['photo', '4 / 3'],
      ['video', '16 / 9'],
      ['wide', '21 / 9'],
      ['portrait', '3 / 4'],
    ],
  },
  // 겹치는 순서도 값이 곧 이름이다.
  z: { steps: [10, 20, 30, 40, 50].map((n) => [String(n), String(n)]) },
  duration: {
    steps: [
      ['fast', '100ms'],
      ['normal', '200ms'],
      ['slow', '300ms'],
      ['slower', '500ms'],
    ],
  },
  ease: {
    steps: [
      ['in', 'cubic-bezier(0.4, 0, 1, 1)'],
      ['out', 'cubic-bezier(0, 0, 0.2, 1)'],
      ['in-out', 'cubic-bezier(0.4, 0, 0.2, 1)'],
    ],
  },
}

/** 이미 쓰는 이름과 겹치지 않는 new, new2, … 정해 둔 이름을 다 썼을 때만 쓴다. */
function spare(taken: Set<string>) {
  let name = 'new'
  for (let i = 2; taken.has(name); i++) name = `new${i}`
  return name
}

/**
 * 정해 둔 이름들 가운데 다음 것. 이미 있는 것 중 가장 뒤의 것 다음에서 찾고, 뒤가 다 찼으면 앞의 빈 것을 쓴다.
 * 아직 하나도 없으면 start 자리에서 시작한다. 다 썼으면 null.
 */
function nextIn<T>(steps: T[], nameOf: (step: T) => string, taken: Set<string>, start = 0): T | null {
  const have = steps.map((s, i) => (taken.has(nameOf(s)) ? i : -1)).filter((i) => i >= 0)
  const from = have.length ? Math.max(...have) + 1 : start
  const free = (s: T) => !taken.has(nameOf(s))
  return steps.slice(from).find(free) ?? steps.find(free) ?? null
}

/** 그 종류에 값을 하나 추가할 때의 이름(짧은 이름)과 값. */
export function nextPreset(kind: Kind, tokens: Token[]): { name: string; value: string } {
  const mine = tokens.filter((t) => kind.matches(t.name))
  const taken = new Set(mine.map((t) => shortName(kind, t.name)))
  const ladder = LADDERS[kind.id]
  if (!ladder) return { name: spare(taken), value: kind.defaultValue }
  const known = ladder.steps.some(([name]) => taken.has(name))
  // 다른 이름 체계로 값을 만들어 둔 경우(body: 16px 등)에는 지금 가장 큰 값보다 큰 첫 단계에서 시작해, 같은 값이 또 생기지 않게 한다.
  let start = ladder.start ?? 0
  if (!known && mine.length > 0) {
    const max = Math.max(...mine.map((t) => parseFloat(t.value)).filter(Number.isFinite))
    const above = ladder.steps.findIndex(([, value]) => parseFloat(value) > max)
    if (Number.isFinite(max) && above >= 0) start = above
  }
  const step = nextIn(ladder.steps, ([name]) => name, taken, start)
  return step ? { name: step[0], value: step[1] } : { name: spare(taken), value: kind.defaultValue }
}

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger']
const SIZES = ['sm', 'md', 'lg', 'xl']

/** 컴포넌트에 종류를 추가할 때의 이름. primary, secondary, ghost, danger의 순서다. */
export function nextVariantName(taken: string[]) {
  const set = new Set(taken)
  return nextIn(VARIANTS, (n) => n, set) ?? spare(set)
}

/** 컴포넌트에 크기를 추가할 때의 이름. sm, md, lg, xl의 순서다. */
export function nextSizeName(taken: string[]) {
  const set = new Set(taken)
  return nextIn(SIZES, (n) => n, set, 1) ?? spare(set)
}

/**
 * 같은 종류의 값 가운데 한 단계 큰 것의 이름. 새 크기를 만들 때 앞 크기의 여백과 글자 크기를 한 단계씩 키우는 데 쓴다.
 * 더 큰 값이 없거나 숫자로 읽을 수 없으면 그대로다.
 */
export function stepUp(tokens: Token[], name: string | undefined) {
  if (!name) return name
  const kind = ALL_KINDS.find((k) => k.matches(name))
  const now = parseFloat(tokens.find((t) => t.name === name)?.value ?? '')
  if (!kind || !Number.isFinite(now)) return name
  const bigger = tokens
    .filter((t) => kind.matches(t.name) && parseFloat(t.value) > now)
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))
  return bigger[0]?.name ?? name
}
