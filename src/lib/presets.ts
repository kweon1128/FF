import type { Token } from './api'
import { ALL_KINDS, KINDS, lineName, shortName, trackName, type Kind } from './catalog'

/**
 * 값을 추가할 때 생기는 것. 아무 이름(new)과 고정된 값이 아니라, 지금 있는 것 다음에 올 단계가 이름과 값을 갖추고 생긴다.
 * 이름과 값은 Tailwind의 관례를 따른다. AI가 짜는 코드가 이 이름(text-lg, font-medium 등)을 그대로 쓰기 때문이다.
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
/**
 * 한 벌을 만들 때 고를 수 있는 본문 크기의 범위(px).
 * 아래는 13이다. 그보다 작으면 본문으로 읽기 힘들고, 두 단계 아래인 xs가 쓸 수 없는 크기로 내려간다.
 * 위는 20이다. 읽는 것이 중심인 서비스(블로그, 뉴스, 문서)는 19~20px까지 쓴다. 글꼴 종류 추가 창의 견본도 20px까지 보여 준다.
 */
export const BASE_MIN = 13
export const BASE_MAX = 20
/**
 * 한 벌을 만들 때 고를 수 있는 단계 사이. 본문보다 큰 단계가 한 단계마다 커지는 배수(ratio)에 이름을 붙인 다섯 칸이고, 처음은 보통(1.2)이다.
 * 창에서는 배수의 숫자가 아니라 이름을 보여 준다. 1.2라는 숫자는 뜻을 아는 사람에게만 읽히고, 고르는 사람이 알고 싶은 것은 촘촘한지 큰지다.
 * 가장 촘촘한 1.075는 정보가 빽빽한 도구, 가장 큰 1.325는 읽는 화면이나 대비가 큰 화면에 쓴다. 그보다 크면 가장 큰 단계가 본문의 세 배를 넘어 제목으로 쓰기 어렵다.
 */
export const SPREAD_STEPS: { ratio: number; label: string }[] = [
  { ratio: 1.075, label: '아주 촘촘' },
  { ratio: 1.125, label: '촘촘' },
  { ratio: 1.2, label: '보통' },
  { ratio: 1.25, label: '크게' },
  { ratio: 1.325, label: '아주 크게' },
]
export const SPREAD_START = 1.2
/**
 * 한 벌에서 본문보다 큰 단계의 수. 본문 아래의 둘(xs, sm)과 본문을 더하면 전체는 5단계에서 9단계다. 처음은 넷(전체 7단계, 3xl까지)이다.
 * 둘보다 적으면 제목이 한 가지 크기뿐이라 위계를 만들 수 없다(보조 설명, 버튼, 본문, 카드 제목, 화면 제목이 최소다).
 * 여섯보다 많으면 쓰임새가 겹친다. 3xl부터는 모두 크게 내세우는 숫자나 문구이고, 셋(3xl, 4xl, 5xl)이면 충분히 나뉜다. 제품 화면을 다루는 시스템은 대개 7~9단계다. 더 필요하면 만든 뒤 판에서 추가한다.
 */
export const UPS_MIN = 2
export const UPS_MAX = 6
export const UPS_START = 4
const UP_NAMES = ['lg', 'xl', '2xl', '3xl', '4xl', '5xl']

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
 * 13px 이하의 작은 글자는 배수를 쓰지 않고 글자 크기에 SMALL_EXTRA를 더해 짝수로 올린다(좁게와 보통은 13px → 18px, 12px → 16px, 11px → 16px. 넓게는 2px씩 더).
 * 경계가 13px인 것은 작은 크기의 줄 높이가 고르게 올라가게 하려는 것이다(12 → 16, 13 → 18, 14 → 20, 15 → 22, 16 → 24). 배수로 정하면 13px이 20px이 되어 12px에서 4px이 한 번에 뛰고, 13px과 14px이 같은 줄 높이가 된다.
 * 작은 글자는 여러 줄 본문보다 칩, 뱃지, 라벨에 쓰이고, 거기서는 12px 글자에 16px 줄이 가장 흔하다(여백 4px을 더하면 높이 24px).
 */
const SMALL_MAX = 13
/**
 * leading은 이름(좁게, 보통, 넓게)이거나, 보통의 줄 높이에 곱하는 배수(scale)다. 한 벌 만들기 창은 본문의 줄 높이를 2px씩 조절하고 그것을 배수로 바꿔 넘긴다.
 * 작은 글자(13px 이하)는 배수가 0.1 커질 때마다 2px씩 더하고, 보통보다 줄이지는 않는다(넓게 1.1이면 +2px, 좁게 0.9는 보통과 같다).
 */
export function lineFor(px: number, leading: Leading | number) {
  const scale = typeof leading === 'number' ? leading : LEADINGS.find((l) => l.id === leading)!.scale
  if (px <= SMALL_MAX) {
    const small = Math.ceil((px + 4) / 2) * 2
    return Math.max(small, small + 2 * Math.round((scale - 1) * 10))
  }
  const t = Math.max(0, Math.min(1, (px - 16) / 16))
  const normal = Math.round((px * (BODY_RATIO + (HEADING_RATIO - BODY_RATIO) * t) - 0.01) / 2) * 2
  // 딱 중간이면 보통 쪽으로: 좁게는 올리고 넓게는 내린다.
  const scaled = Math.round((normal * scale + (scale < 1 ? 0.01 : -0.01)) / 2) * 2
  // 글자보다 적어도 2px은 높아야 줄이 겹치지 않는다.
  return Math.max(Math.ceil((px + 2) / 2) * 2, scaled)
}

/**
 * 한 벌을 만들 때 고를 수 있는 본문의 줄 높이(px). normal은 보통의 값이고, 2px씩 조절한다.
 * 아래는 보통보다 2px 낮은 값이다(글자보다 4px은 높게). 더 좁히면 본문보다 작은 글자의 줄이 글자에 붙는다(14px 글자에 16px 줄).
 * 위는 보통보다 8px 높은 값이다. 더 벌리면 버튼과 칩의 높이가 어색해진다.
 */
export function baseLineRange(base: number) {
  const normal = lineFor(base, 'normal')
  return { normal, min: Math.min(normal, Math.max(normal - 2, Math.ceil((base + 4) / 2) * 2)), max: normal + 8 }
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
 * 본문 크기와 간격으로 글자 크기 한 벌을 만든다. 본문 아래로 둘(xs, sm), 본문, 본문 위로 ups개(처음은 넷이라 3xl까지 일곱 단계)다. 줄 높이도 leading의 방식으로 함께 정한다.
 * 본문보다 큰 단계는 한 단계마다 간격의 배수만큼 커지고 가까운 정수 px에 맞춘다. 짝수로 몰지 않고 홀수도 쓴다.
 * 고른 배수를 그대로 따르기 위해서이고, 13px, 15px 같은 홀수 크기는 흔히 쓰인다. 짝수여야 하는 것은 줄 높이다.
 * 본문보다 작은 단계는 본문의 7/8, 3/4이다. 작은 글자는 간격을 벌려도 더 작아지면 안 읽히므로 간격과 관계없이 정한다.
 * 가장 작은 단계는 11px 아래로 내려가지 않는다. 10px의 한글은 획이 붙어 읽기 어렵고, 보조 설명과 작은 버튼처럼 읽어야 하는 글이 이 단계를 쓴다.
 * 그래서 본문 13px에서는 12px, 11px이 된다(바닥이 없으면 11px, 10px). 본문이 14px 이상이면 바닥에 닿지 않아 그대로다.
 */
/** 한 벌의 가장 작은 단계가 내려갈 수 있는 바닥(px). */
export const SIZE_FLOOR = 11
export type SizeStep = { name: string; size: string; line: string; /** 묶인 글자 사이. 글꼴이 정한 그대로 두면 null. */ track: string | null }
export function sizeScale(base: number, spread: Spread | number, leading: Leading | number = 'normal', tighten = true, ups = UPS_START): SizeStep[] {
  // spread는 이름(촘촘, 보통, 크게)이거나 배수 그 자체다.
  const ratio = typeof spread === 'number' ? spread : SPREADS.find((s) => s.id === spread)!.ratio
  // 작은 단계는 본문보다, 그리고 서로보다 작아야 한다.
  const xs = Math.max(SIZE_FLOOR, Math.min(Math.round(base * 0.75), base - 2))
  const sm = Math.max(xs + 1, Math.min(Math.round(base * 0.875), base - 1))
  const sizes: [string, number][] = [
    ['xs', xs],
    ['sm', sm],
    ['base', base],
  ]
  let prev = base
  // 본문보다 큰 단계는 ups개다. 크기에 따로 제한을 두지 않는다. 고를 수 있는 값의 끝(본문 20px, 본문 위로 여섯 단계, 단계 사이 1.325배)에서 가장 큰 단계가 108px이고, 그것이 곧 한계다.
  for (const [i, name] of UP_NAMES.slice(0, Math.max(UPS_MIN, Math.min(UPS_MAX, ups))).entries()) {
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
