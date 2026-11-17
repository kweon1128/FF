// 의미 글꼴: 글꼴 판의 재료(글꼴 종류, 글자 크기, 굵기) 가운데 실제로 쓰는 조합에 쓰임새의 이름을 붙인 것.
// 파일에는 CSS의 font 한 줄 값으로 적는다. 그래서 `font: var(--type-title-lg)` 한 줄이면 글꼴, 크기, 굵기, 줄 높이가 모두 따라온다.
//   --type-title-lg: var(--font-weight-semibold) var(--text-2xl)/var(--text-2xl--line-height) var(--font-sans); /* 화면의 제목 */
//   --type-title-lg--letter-spacing: var(--text-2xl--letter-spacing);
// 사람이 고르는 것은 글꼴 종류, 글자 크기, 굵기 셋이다. 줄 높이와 글자 사이는 글자 크기에 묶여 있어서 크기를 따라간다.
// 다만 오래 읽는 긴 글(줄 높이가 더 넓다)이나 제목 위의 작은 분류 표시(글자 사이가 넓다)처럼 같은 크기인데 줄 높이나 글자 사이만 다른 조합이 있다.
// 그런 조합은 그 값을 직접 적어 둔다(줄 높이는 font 값 안에 36px처럼, 글자 사이는 뒤에 붙는 값에 0.08em처럼). 직접 적은 값은 크기를 따라가지 않는다.
// font 한 줄에는 글자 사이가 들어가지 않으므로, 크기에 묶인 글자 사이가 있으면 그것을 가리키는 값을 따로 붙여 둔다.

import type { Token } from './api'
import { KINDS, lineName, trackName } from './catalog'

const STYLE = KINDS.style
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight

/** 의미 글꼴 하나가 가리키는 세 값의 변수 이름. line은 크기를 따르지 않고 직접 정한 줄 높이(36px)로, 없으면 크기를 따른다. */
export type TypeParts = { font: string; size: string; weight: string; line?: string }

const VALUE = /^var\((--font-weight-[a-z0-9-]+)\)\s+var\((--text-[a-z0-9-]+)\)(?:\s*\/\s*(var\(--text-[a-z0-9-]+\)|\d*\.?\d+px))?\s+var\((--font-[a-z0-9-]+)\)$/

/** 저장된 값에서 가리키는 세 값을 읽는다. 이 형식이 아니면 null. */
export function readType(value: string): TypeParts | null {
  const m = VALUE.exec(value.trim())
  if (!m) return null
  const line = m[3] && !m[3].startsWith('var(') ? m[3] : undefined
  return { weight: m[1], size: m[2], font: m[4], ...(line ? { line } : {}) }
}

/** 세 값을 font 한 줄 값으로 적는다. 줄 높이는 그 크기에 묶인 것이 있을 때만 적는다(names는 지금 있는 변수 이름들). */
export function writeType(parts: TypeParts, names: Set<string>) {
  const line = parts.line ? `/${parts.line}` : names.has(lineName(parts.size)) ? `/var(${lineName(parts.size)})` : ''
  return `var(${parts.weight}) var(${parts.size})${line} var(${parts.font})`
}

const isTypeTrack = (name: string) => name.startsWith(STYLE.prefix) && name.endsWith('--letter-spacing')

/** 이 의미 글꼴에 직접 정해 둔 글자 사이(0.08em). 크기를 따르고 있으면 undefined. */
export function trackOverride(tokens: Token[], styleName: string) {
  const value = tokens.find((t) => t.name === trackName(styleName))?.value
  return value && !value.startsWith('var(') ? value : undefined
}

/** 의미 글꼴의 글자 사이를 직접 정하거나(0.08em), null이면 다시 크기를 따르게 한다. */
export function withTypeTrack(tokens: Token[], styleName: string, value: string | null) {
  const rest = tokens.filter((t) => t.name !== trackName(styleName))
  if (value === null) return rest
  return rest.flatMap((t) => (t.name === styleName ? [t, { name: trackName(styleName), value }] : [t]))
}

/**
 * 의미 글꼴의 값을 지금의 글자 크기에 맞춘다. 값을 저장할 때마다 거친다.
 * 크기에 묶인 줄 높이가 생기거나 없어지면 font 값의 줄 높이 자리가 따라가고, 묶인 글자 사이가 있으면 의미 글꼴 바로 뒤에 그것을 가리키는 값이 놓인다.
 * 의미 글꼴을 지우거나 이름을 바꾸거나 복제했을 때 뒤에 붙은 글자 사이 값도 여기서 함께 정리된다.
 */
export function syncTypes(tokens: Token[]): Token[] {
  if (!tokens.some((t) => t.name.startsWith(STYLE.prefix))) return tokens
  const names = new Set(tokens.map((t) => t.name))
  const out: Token[] = []
  for (const t of tokens) {
    if (isTypeTrack(t.name)) continue
    const parts = STYLE.matches(t.name) ? readType(t.value) : null
    if (!parts) {
      out.push(t)
      continue
    }
    const value = writeType(parts, names)
    out.push(value === t.value ? t : { ...t, value })
    // 직접 정해 둔 글자 사이는 그대로 두고, 아니면 크기에 묶인 글자 사이를 가리키게 한다.
    const own = trackOverride(tokens, t.name)
    if (own) out.push({ name: trackName(t.name), value: own })
    else if (names.has(trackName(parts.size))) out.push({ name: trackName(t.name), value: `var(${trackName(parts.size)})` })
  }
  return out
}

/** 이름이 바뀐 글꼴 종류, 글자 크기, 굵기를 가리키던 의미 글꼴이 새 이름을 따라가게 한다. */
export function followTypeRefs(tokens: Token[], renames: Record<string, string>) {
  return tokens.map((t) => {
    if (!STYLE.matches(t.name)) return t
    const value = t.value.replace(/var\((--[a-z0-9-]+)\)/g, (all, name: string) => (renames[name] ? `var(${renames[name]})` : all))
    return value === t.value ? t : { ...t, value }
  })
}

/** 이 값(글꼴 종류, 글자 크기, 굵기)을 가리키는 의미 글꼴들의 변수 이름. */
export function typeUsers(tokens: Token[], name: string) {
  return tokens
    .filter((t) => {
      const parts = STYLE.matches(t.name) ? readType(t.value) : null
      return parts && (parts.font === name || parts.size === name || parts.weight === name)
    })
    .map((t) => t.name)
}

/**
 * 의미 글꼴이 실제로 그려질 모습. 가리키는 값이 없어졌으면 그 자리는 undefined다.
 * broken은 글꼴 종류, 크기, 굵기 가운데 하나라도 없어졌는지다. 코드에서는 font: var(--type-이름) 한 줄로 쓰이는데,
 * 그 안의 var() 하나만 없어도 줄 전체가 무효가 되어 글꼴과 크기와 굵기를 모두 잃는다. 그래서 FF도 남은 값으로 그리지 않고 통째로 깨진 것으로 그린다.
 */
export type TypeLook = {
  parts: TypeParts
  broken: boolean
  family?: string
  size?: string
  weight?: string
  line?: string
  track?: string
}

/** styleName을 주면 그 의미 글꼴에 직접 정해 둔 글자 사이를 먼저 쓴다. */
export function lookOf(tokens: Token[], value: string, styleName?: string): TypeLook | null {
  const parts = readType(value)
  if (!parts) return null
  const get = (name: string) => tokens.find((t) => t.name === name)?.value
  return {
    parts,
    broken: [parts.font, parts.size, parts.weight].some((name) => get(name) === undefined),
    family: get(parts.font),
    size: get(parts.size),
    weight: get(parts.weight),
    line: parts.line ?? get(lineName(parts.size)),
    track: (styleName && trackOverride(tokens, styleName)) || get(trackName(parts.size)),
  }
}

const px = (value: string) => {
  const m = /^(\d*\.?\d+)(px|rem)$/.exec(value.trim())
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : NaN
}

/**
 * 기본 한 벌. 제목 셋, 본문, 본문 강조, 보조 설명, 이름표, 버튼.
 * step은 본문 크기(16px에 가장 가까운 크기)에서 몇 단계 위아래인지, weight는 어느 굵기에 가까운 것을 고를지다.
 * 정해진 값이 아니라 지금 있는 크기와 굵기 가운데에서 고르므로, 어떤 한 벌을 만들어 두었든 그 안에서 짝이 지어진다.
 */
const SET: { name: string; note: string; step: number; weight: number; heading?: boolean; mono?: boolean; off?: boolean; needs?: number; heavier?: boolean; track?: string }[] = [
  // off는 처음에는 빼 두는 후보다. 모든 서비스가 쓰는 것은 아니어서, 한 벌을 만드는 창에서 화면을 보고 고르게 한다.
  // needs는 본문보다 큰 단계가 그만큼 있을 때만 내는 후보다(없으면 아래 후보와 크기가 똑같아진다).
  // heavier는 바라는 굵기가 없을 때 가까운 쪽이 아니라 더 굵은 쪽을 고르는 후보다. 버튼의 글자는 본문보다 굵어야 눌리는 것으로 보인다.
  // track은 글자 사이를 직접 정하는 후보다(지금은 그런 후보가 없다).
  // 내세우는 자리는 큰 단계가 있는 만큼 나오고(7단계부터 하나씩), 나오면 처음부터 켜져 있다.
  // 그만큼 큰 크기를 만들어 두었다는 것은 쓰겠다는 뜻이고, 그래야 판에 있는 크기가 하나도 빠짐없이 쓰인다.
  { name: 'display-xl', note: '가장 크게 내세우는 자리', step: 6, weight: 700, heading: true, needs: 6 },
  { name: 'display-lg', note: '더 크게 내세우는 자리', step: 5, weight: 700, heading: true, needs: 5 },
  { name: 'display', note: '크게 내세우는 숫자나 문구', step: 4, weight: 700, heading: true, needs: 4 },
  { name: 'title-lg', note: '화면의 제목', step: 3, weight: 600, heading: true },
  { name: 'title-md', note: '구역의 제목', step: 2, weight: 600, heading: true },
  { name: 'title-sm', note: '카드와 창의 제목', step: 1, weight: 600, heading: true },
  { name: 'body-lg', note: '제목 아래의 소개 글', step: 1, weight: 400, off: true },
  { name: 'body', note: '본문', step: 0, weight: 400 },
  // 본문 속 강조는 앞뒤의 400 글자와 나란히 놓이므로 한 단계(500)로는 묻힌다. 600에 가까운 굵기를 쓴다.
  { name: 'body-strong', note: '본문 속 강조', step: 0, weight: 600 },
  { name: 'body-sm', note: '덜 중요한 본문', step: -1, weight: 400, off: true },
  { name: 'quote', note: '인용문', step: 1, weight: 500, off: true },
  { name: 'caption', note: '보조 설명', step: -2, weight: 400 },
  // 영어 대문자 표시라면 글자 사이를 넓히지만, 한글은 넓히면 흩어져 보여서 크기와 굵기만으로 구분한다.
  { name: 'overline', note: '제목 위의 분류 표시', step: -2, weight: 600, off: true },
  { name: 'label', note: '입력칸의 이름표', step: -1, weight: 500 },
  { name: 'button-lg', note: '큰 버튼', step: 0, weight: 500, off: true, heavier: true },
  { name: 'button', note: '버튼', step: -1, weight: 500, heavier: true },
  { name: 'button-sm', note: '작은 버튼', step: -2, weight: 500, off: true, heavier: true },
  { name: 'numeric', note: '금액과 통계의 숫자', step: 1, weight: 600, off: true },
  { name: 'code', note: '주문 번호 같은 고정폭 글자', step: -1, weight: 400, mono: true, off: true },
]

/** 본문 크기를 뜻하는 이름들. */
const BASE_NAMES = ['base', 'body', 'md', 'medium', 'default', 'normal', 'text', 'm']

/** 한 벌을 만들 재료가 모자라면, 무엇이 없는지(종류의 이름들). */
export function missingForTypes(tokens: Token[]) {
  return [FONT, SIZE, WEIGHT].filter((k) => !tokens.some((t) => k.matches(t.name))).map((k) => k.title)
}

/**
 * 지금 있는 글꼴 종류, 글자 크기, 굵기로 한 벌의 후보들을 짓는다. on은 처음부터 쓰는 것으로 표시해 둘지다.
 * 재료가 모자라면 빈 목록.
 */
/** track은 그 후보에 직접 정해 둔 글자 사이(없으면 크기를 따른다). */
export function typeCandidates(tokens: Token[]): { on: boolean; token: Token; track?: string }[] {
  const fonts = tokens.filter((t) => FONT.matches(t.name))
  const sizes = tokens.filter((t) => SIZE.matches(t.name) && Number.isFinite(px(t.value))).sort((a, b) => px(a.value) - px(b.value))
  const weights = tokens.filter((t) => WEIGHT.matches(t.name) && Number.isFinite(Number(t.value)))
  if (!fonts.length || !sizes.length || !weights.length) return []
  const names = new Set(tokens.map((t) => t.name))
  const named = (...words: string[]) => fonts.find((t) => words.includes(t.name.slice(FONT.prefix.length)))
  // 본문 글꼴: sans, body 같은 이름이 있으면 그것, 없으면 고정폭이 아닌 첫 글꼴.
  const body = named('sans', 'body', 'base', 'text') ?? fonts.find((t) => !/mono|code/.test(t.name)) ?? fonts[0]
  // 제목 글꼴: display, heading 같은 이름이 있으면 그것, 없으면 본문 글꼴.
  const heading = named('display', 'heading', 'title') ?? body
  // 본문 크기: base나 body처럼 본문을 뜻하는 이름이 있으면 그것, 없으면 16px에 가장 가까운 크기. 크기만 보고 고르면 본문을 18px이나 20px로 잡은 한 벌에서 작은 단계가 본문으로 잡힌다.
  // 한 벌을 만들 때 base의 이름을 body나 md로 고쳐도 본문을 찾을 수 있게 흔한 이름들을 함께 본다.
  const named16 = sizes.reduce((best, t, i) => (Math.abs(px(t.value) - 16) < Math.abs(px(sizes[best].value) - 16) ? i : best), 0)
  const namedBase = sizes.findIndex((t) => BASE_NAMES.includes(t.name.slice(SIZE.prefix.length)))
  const base = namedBase !== -1 ? namedBase : named16
  // 본문보다 큰 단계의 수. 한 벌의 단계 수(5에서 9)에 따라 2에서 6이다.
  const ups = sizes.length - 1 - base
  // 제목 셋은 위에서부터 채운다. 큰 단계가 셋 넘게 있으면 +3, +2, +1이고, 모자라면 있는 가장 큰 단계부터 한 칸씩 내려온다(본문 크기 아래로는 가지 않는다).
  // 정해진 칸에 그대로 놓으면 단계가 적은 한 벌에서 화면 제목과 구역 제목이 같은 크기가 된다.
  const titleTop = Math.min(3, ups)
  const stepOf = (s: (typeof SET)[number]) =>
    s.name === 'title-lg' ? titleTop : s.name === 'title-md' ? Math.max(0, titleTop - 1) : s.name === 'title-sm' ? Math.max(0, titleTop - 2) : s.step
  const sizeAt = (step: number) => sizes[Math.min(sizes.length - 1, Math.max(0, base + step))]
  const weightNear = (want: number) => weights.reduce((best, t) => (Math.abs(Number(t.value) - want) < Math.abs(Number(best.value) - want) ? t : best))
  // 더 굵은 쪽을 고르는 후보: 바라는 굵기가 있으면 그것, 없으면 그보다 굵은 것 가운데 가장 가까운 것, 그것도 없으면 가장 가까운 것.
  const weightUp = (want: number) =>
    weights.filter((t) => Number(t.value) >= want).sort((a, b) => Number(a.value) - Number(b.value))[0] ?? weightNear(want)
  // 고정폭 글꼴: mono, code 같은 이름이 있으면 그것, 없으면 본문 글꼴.
  const mono = fonts.find((t) => /mono|code/.test(t.name)) ?? body
  return SET.filter((s) => !s.needs || ups >= s.needs).map((s) => {
    const size = sizeAt(stepOf(s))
    const parts: TypeParts = { font: (s.mono ? mono : s.heading ? heading : body).name, size: size.name, weight: (s.heavier ? weightUp(s.weight) : weightNear(s.weight)).name }
    return { on: !s.off, token: { name: STYLE.prefix + s.name, value: writeType(parts, names), note: s.note }, ...(s.track ? { track: s.track } : {}) }
  })
}

/** 기본 한 벌. 후보 가운데 처음부터 쓰는 것으로 표시된 여덟 개다. */
export function typeSet(tokens: Token[]): Token[] {
  return typeCandidates(tokens)
    .filter((c) => c.on)
    .map((c) => c.token)
}

/**
 * "추가"로 하나를 만들 때의 의미 글꼴. 기본 한 벌 가운데 아직 없는 첫 번째가 생긴다.
 * 한 벌이 모두 있으면 본문과 같은 조합이 custom이라는 이름으로 생긴다. 재료가 모자라면 null.
 */
export function nextType(tokens: Token[]): Token | null {
  const set = typeSet(tokens)
  if (set.length === 0) return null
  const taken = new Set(tokens.map((t) => t.name))
  // 내세우는 자리(display…)는 맨 나중에 낸다. 빈 판에서 "추가"를 눌렀을 때 제목과 본문이 먼저 생겨야 한다.
  const showy = (t: Token) => t.name.startsWith(`${STYLE.prefix}display`)
  const missing = [...set.filter((t) => !showy(t)), ...set.filter(showy)].find((t) => !taken.has(t.name))
  if (missing) return missing
  let name = `${STYLE.prefix}custom`
  for (let i = 2; taken.has(name); i++) name = `${STYLE.prefix}custom-${i}`
  return { name, value: set.find((t) => t.name === `${STYLE.prefix}body`)!.value, note: '' }
}
