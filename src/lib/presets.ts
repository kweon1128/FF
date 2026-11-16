import type { Token } from './api'
import { ALL_KINDS, KINDS, lineName, shortName, trackName, type Kind } from './catalog'

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
      // 옅은 그림자 두 겹. 가까이 짧게 지는 것과 멀리 넓게 퍼지는 것을 겹쳐야 떠 있는 느낌이 자연스럽다. 진한 한 겹은 무겁고 예전 화면처럼 보인다.
      ['sm', '0 1px 1px rgb(0 0 0 / 0.04), 0 2px 4px rgb(0 0 0 / 0.04)'],
      ['md', '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 16px rgb(0 0 0 / 0.06)'],
      ['lg', '0 4px 8px rgb(0 0 0 / 0.04), 0 16px 32px rgb(0 0 0 / 0.08)'],
      ['xl', '0 8px 16px rgb(0 0 0 / 0.05), 0 32px 64px rgb(0 0 0 / 0.1)'],
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
      // 화면에 나타나고 반응하는 움직임은 거의 다 out이다(빠르게 출발해 부드럽게 멈춤). 그래서 out이 먼저 생긴다.
      // in은 화면에서 사라질 때만 쓴다. 곡선은 끝에서 더 길게 감속하는 것으로, 예전 Material의 (0.4, 0, 0.2, 1)보다 부드럽게 멈춘다.
      ['out', 'cubic-bezier(0.16, 1, 0.3, 1)'],
      ['in-out', 'cubic-bezier(0.65, 0, 0.35, 1)'],
      ['in', 'cubic-bezier(0.7, 0, 0.84, 0)'],
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

// ── 글자 크기 한 벌 ───────────────────────────────────

/** 단계 사이의 간격. 본문보다 큰 단계가 한 단계마다 몇 배씩 커지는지. */
export type Spread = 'tight' | 'normal' | 'wide'
export const SPREADS: { id: Spread; label: string; ratio: number }[] = [
  { id: 'tight', label: '촘촘', ratio: 1.125 },
  { id: 'normal', label: '보통', ratio: 1.2 },
  { id: 'wide', label: '크게', ratio: 1.25 },
]
/** 한 벌을 만들 때 고를 수 있는 본문 크기의 범위(px). */
export const BASE_MIN = 13
export const BASE_MAX = 18

/**
 * 줄 높이를 정하는 방식. 기준은 보통이고, 좁게와 넓게는 보통의 줄 높이에서 10%를 빼거나 더한 것이다(scale).
 * 세 가지를 따로 계산하지 않고 보통에서 끌어내기 때문에, 어느 크기에서나 좁게 < 보통 < 넓게가 같은 폭으로 나란히 간다(본문 크기에서 2px씩, 큰 제목에서 4px씩).
 */
export type Leading = 'snug' | 'normal' | 'loose'
export const LEADINGS: { id: Leading; label: string; scale: number }[] = [
  { id: 'snug', label: '좁게', scale: 0.9 },
  { id: 'normal', label: '보통', scale: 1 },
  { id: 'loose', label: '넓게', scale: 1.1 },
]
/** 보통의 배수. 16px 이하의 글자는 본문 배수, 32px 이상은 제목 배수이고 그 사이는 고르게 잇는다. */
const BODY_RATIO = 1.5
const HEADING_RATIO = 1.25

/**
 * 그 크기의 줄 높이(px). 항상 짝수 px이다. 줄 높이가 짝수여야 글자와 아이콘이 줄의 한가운데에 놓인다.
 * 글자가 클수록 배수를 줄인다. 큰 글자는 같은 배수로 띄우면 줄 사이가 휑해 보인다.
 * 보통은 글자 크기에 배수를 곱해 가까운 짝수로 맞추고, 딱 중간에 걸리면 작은 쪽으로 내린다(14px × 1.5 = 21 → 20).
 * 좁게와 넓게는 그 값에 scale을 곱해 가까운 짝수로 맞추고, 딱 중간에 걸리면 보통에 가까운 쪽으로 맞춘다(16px이면 22, 24, 26).
 * 12px 이하의 작은 글자는 배수를 쓰지 않고 글자 크기에 SMALL_EXTRA를 더해 짝수로 올린다(좁게와 보통은 12px → 16px, 11px → 16px, 넓게는 18px).
 * 작은 글자는 여러 줄 본문보다 칩, 뱃지, 라벨에 쓰이고, 거기서는 12px 글자에 16px 줄이 가장 흔하다(여백 4px을 더하면 높이 24px).
 */
const SMALL_MAX = 12
const SMALL_EXTRA: Record<Leading, number> = { snug: 4, normal: 4, loose: 6 }
export function lineFor(px: number, leading: Leading) {
  if (px <= SMALL_MAX) return Math.ceil((px + SMALL_EXTRA[leading]) / 2) * 2
  const { scale } = LEADINGS.find((l) => l.id === leading)!
  const t = Math.max(0, Math.min(1, (px - 16) / 16))
  const normal = Math.round((px * (BODY_RATIO + (HEADING_RATIO - BODY_RATIO) * t) - 0.01) / 2) * 2
  // 딱 중간이면 보통 쪽으로: 좁게는 올리고 넓게는 내린다.
  const scaled = Math.round((normal * scale + (scale < 1 ? 0.01 : -0.01)) / 2) * 2
  // 글자보다 적어도 2px은 높아야 줄이 겹치지 않는다.
  return Math.max(Math.ceil((px + 2) / 2) * 2, scaled)
}

/**
 * 그 크기에 어울리는 글자 사이(em). 큰 글자일수록 좁힌다. 글자가 커지면 글자 사이가 휑해 보이기 때문이다.
 * 16px 이하는 글꼴이 정한 그대로 두고(null), 32px에서 -0.02em이 되도록 고르게 좁히며 0.005em 단위로 맞춘다(19px -0.005, 23px -0.01, 28px -0.015, 33px -0.02).
 * 작은 글자는 좁히면 뭉개져서 읽기 어려우므로 손대지 않는다.
 */
export function trackFor(px: number): string | null {
  const t = Math.max(0, Math.min(1, (px - 16) / 16))
  const em = Math.round((0.02 * t) / 0.005) * 0.005
  return em > 0 ? `-${Number(em.toFixed(3))}em` : null
}

/**
 * 본문 크기와 간격으로 글자 크기 한 벌(xs부터 3xl까지 일곱 단계)을 만든다. 줄 높이도 leading의 방식으로 함께 정한다.
 * 본문보다 큰 단계는 한 단계마다 간격의 배수만큼 커지고 가까운 정수 px에 맞춘다. 짝수로 몰지 않고 홀수도 쓴다.
 * 고른 배수를 그대로 따르기 위해서이고, 13px, 15px 같은 홀수 크기는 흔히 쓰인다. 짝수여야 하는 것은 줄 높이다.
 * 본문보다 작은 단계는 본문의 7/8, 3/4이다. 작은 글자는 간격을 벌려도 더 작아지면 안 읽히므로 간격과 관계없이 정한다.
 */
export type SizeStep = { name: string; size: string; line: string; /** 묶인 글자 사이. 글꼴이 정한 그대로 두면 null. */ track: string | null }
export function sizeScale(base: number, spread: Spread, leading: Leading = 'normal', tighten = true): SizeStep[] {
  const ratio = SPREADS.find((s) => s.id === spread)!.ratio
  // 작은 단계는 본문보다, 그리고 서로보다 작아야 한다.
  const sm = Math.min(Math.round(base * 0.875), base - 1)
  const xs = Math.min(Math.round(base * 0.75), sm - 1)
  const sizes: [string, number][] = [
    ['xs', xs],
    ['sm', sm],
    ['base', base],
  ]
  let prev = base
  for (const [i, name] of ['lg', 'xl', '2xl', '3xl'].entries()) {
    // 고른 배수를 따르고 가까운 정수 px로 맞춘다. 앞 단계보다는 커야 한다.
    prev = Math.max(Math.round(base * ratio ** (i + 1)), prev + 1)
    sizes.push([name, prev])
  }
  return sizes.map(([name, px]) => ({ name, size: `${px}px`, line: `${lineFor(px, leading)}px`, track: tighten ? trackFor(px) : null }))
}

// ── 굵기 한 벌 ────────────────────────────────────────

/** 굵기가 맡는 쓰임. 본문, 본문 속 강조, 버튼, 선택된 항목, 이름표, 제목. */
export type WeightRole = 'body' | 'strong' | 'button' | 'selected' | 'label' | 'heading'
/** 굵기 한 단계. 이름은 Tailwind의 것이라 코드에서 font-medium, font-bold로 바로 쓰인다. use는 흔히 쓰이는 곳, roles는 견본에서 이 단계로 그리는 쓰임들. */
export type WeightStep = { name: string; weight: number; use: string; roles: WeightRole[] }

/**
 * 단계 수에 따른 굵기 한 벌. 단계가 적을수록 한 단계가 맡는 쓰임이 많다.
 * 2단계면 본문과 그 밖의 모든 것, 3단계면 본문 / 버튼과 선택 / 제목과 강조, 4단계면 강조와 버튼을 한 단계 더 나눈다.
 */
export const WEIGHT_SETS: { count: number; label: string; steps: WeightStep[] }[] = [
  {
    count: 2,
    label: '2',
    steps: [
      { name: 'regular', weight: 400, use: '본문·입력칸', roles: ['body', 'label'] },
      { name: 'bold', weight: 700, use: '제목·버튼·강조', roles: ['strong', 'button', 'selected', 'heading'] },
    ],
  },
  {
    count: 3,
    label: '3',
    steps: [
      { name: 'regular', weight: 400, use: '본문·입력칸', roles: ['body'] },
      { name: 'medium', weight: 500, use: '버튼·선택·이름표', roles: ['button', 'selected', 'label'] },
      // 가장 굵은 단계를 700이 아니라 600에 둔다. 700은 화면에서 무겁고, 획이 많은 한글은 뭉쳐 보이기 쉽다.
      { name: 'semibold', weight: 600, use: '제목·강조', roles: ['strong', 'heading'] },
    ],
  },
  {
    count: 4,
    label: '4',
    steps: [
      { name: 'regular', weight: 400, use: '본문·입력칸', roles: ['body'] },
      { name: 'medium', weight: 500, use: '선택·이름표', roles: ['selected', 'label'] },
      { name: 'semibold', weight: 600, use: '버튼·강조', roles: ['strong', 'button'] },
      { name: 'bold', weight: 700, use: '제목', roles: ['heading'] },
    ],
  },
]

// ── 글자 크기를 하나 더할 때 ──────────────────────────

/**
 * 글자 크기를 하나 추가할 때 생기는 단계. 정해진 표의 값이 아니라 지금 있는 크기들을 이어 간다.
 * 이름은 다음 이름(xs, sm, base, lg, xl, 2xl, …)이고, 크기는 가장 큰 두 단계 사이의 배수만큼 더 큰 값이다(한 벌 만들기의 단계 사이를 그대로 잇는다).
 * 크기가 하나뿐이면 1.2배, 하나도 없으면 base 16px이다. 빠진 작은 이름(xs, sm)이 생길 차례면 가장 작은 크기의 7/8이다.
 * 줄 높이는 기준이 된 단계와 같은 방식(좁게, 보통, 넓게)으로, 글자 사이는 이 시스템이 큰 글자를 좁히고 있을 때만 붙인다.
 */
export function nextSize(tokens: Token[]): SizeStep {
  const SIZE = KINDS.size
  const px = (v: string) => parseFloat(v) * (v.trim().endsWith('rem') ? 16 : 1)
  const sizes = tokens
    .filter((t) => SIZE.matches(t.name) && Number.isFinite(px(t.value)))
    .map((t) => ({ name: t.name, short: shortName(SIZE, t.name), px: px(t.value) }))
    .sort((a, b) => a.px - b.px)
  const name = nextPreset(SIZE, tokens).name
  const make = (value: number, leading: Leading, tighten: boolean): SizeStep => ({ name, size: `${value}px`, line: `${lineFor(value, leading)}px`, track: tighten ? trackFor(value) : null })
  if (sizes.length === 0) return make(16, 'normal', true)
  const order = LADDERS.size!.steps.map(([n]) => n)
  const known = sizes.map((s) => order.indexOf(s.short)).filter((i) => i >= 0)
  const big = sizes[sizes.length - 1]
  const small = sizes[0]
  // 지금 있는 이름들보다 앞의 이름이 생길 차례면 더 작은 단계다.
  const smaller = known.length > 0 && order.indexOf(name) >= 0 && order.indexOf(name) < Math.min(...known)
  let value: number
  if (smaller) value = Math.min(Math.round(small.px * 0.875), small.px - 1)
  else {
    const before = sizes[sizes.length - 2]
    const ratio = before ? big.px / before.px : 1.2
    value = Math.max(Math.round(big.px * (ratio >= 1.05 && ratio <= 1.5 ? ratio : 1.2)), big.px + 1)
  }
  const from = smaller ? small : big
  const line = parseFloat(tokens.find((t) => t.name === lineName(from.name))?.value ?? '')
  const leading = (['normal', 'snug', 'loose'] as const).find((id) => lineFor(from.px, id) === line) ?? 'normal'
  // 큰 글자의 글자 사이를 좁히고 있는 시스템인지. 묶인 글자 사이가 하나라도 있거나, 아직 좁힐 만큼 큰 글자가 없으면 그렇다고 본다.
  const tighten = tokens.some((t) => t.name.startsWith(SIZE.prefix) && t.name === trackName(t.name.slice(0, -'--letter-spacing'.length))) || !sizes.some((s) => s.px > 16)
  return make(value, leading, tighten)
}
