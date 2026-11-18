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

/**
 * 의미 글꼴의 묶음. 의미 색을 역할(글자, 바탕…)로 묶듯, 의미 글꼴은 그 글자가 화면에서 맡는 일로 묶는다.
 * 묶음은 판의 차례를 정하고(제목부터 숫자·코드까지), 줄마다 그리는 예시의 장면을 정한다(제목은 본문이 따르는 제목으로, 컨트롤은 버튼과 이름표로).
 * hint는 그 묶음에 드는 것들. 묶음을 고르는 칸에 함께 적는다.
 */
export type TypeUse = 'heading' | 'body' | 'support' | 'control' | 'data'

export const TYPE_USES: { id: TypeUse; label: string; hint: string }[] = [
  { id: 'heading', label: '제목', hint: '화면, 구역, 카드 제목' },
  { id: 'body', label: '본문', hint: '본문, 강조, 인용' },
  { id: 'support', label: '보조', hint: '설명, 분류 표시' },
  { id: 'control', label: '컨트롤', hint: '버튼, 이름표, 메뉴, 탭' },
  { id: 'data', label: '숫자·코드', hint: '금액, 통계, 고정폭' },
]

const useLabel = (use: TypeUse) => TYPE_USES.find((u) => u.id === use)!.label

/** 묶음을 적지 않은 의미 글꼴은 이름에서 짐작한다. title-lg는 제목, button은 컨트롤처럼. 어디에도 들지 않으면 본문이다. */
export function guessTypeUse(short: string): TypeUse {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (has('code', 'mono', 'numeric', 'number', 'num', 'stat', 'data', 'kbd', 'price', 'amount')) return 'data'
  if (has('display', 'title', 'heading', 'headline', 'subtitle', 'hero', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6')) return 'heading'
  if (has('caption', 'overline', 'eyebrow', 'helper', 'hint', 'footnote', 'meta', 'legal')) return 'support'
  if (has('button', 'btn', 'label', 'menu', 'nav', 'tab', 'link', 'input', 'field', 'chip', 'badge', 'tag', 'control', 'action')) return 'control'
  return 'body'
}

/**
 * 예시의 모양. 판의 줄마다 그 조합을 어떤 자리에 놓아 보여 줄지다.
 * 묶음 하나에도 쓰임이 여럿이라(컨트롤 묶음에 버튼, 메뉴, 뱃지가 함께 있다) 묶음으로 장면을 정하면 메뉴 글자가 버튼으로 그려진다. 그래서 줄마다 따로 정한다.
 * 적어 두지 않은 조합은 이름에서 짐작하고(menu는 메뉴, button은 버튼), 짐작할 수 없으면 묶음의 첫 모양을 쓴다.
 */
export type TypeShape = 'title' | 'paragraph' | 'caption' | 'button' | 'field' | 'menu' | 'menu-on' | 'tab' | 'badge' | 'number' | 'code'

export const TYPE_SHAPES: { id: TypeShape; label: string; hint: string }[] = [
  { id: 'title', label: '제목', hint: '아래에 본문이 따르는 제목' },
  { id: 'paragraph', label: '문단', hint: '줄이 바뀌는 글' },
  { id: 'caption', label: '설명', hint: '이름 아래의 작은 글' },
  { id: 'button', label: '버튼', hint: '채운 버튼과 테두리 버튼' },
  { id: 'field', label: '이름표', hint: '입력칸 위의 이름표' },
  { id: 'menu', label: '메뉴', hint: '메뉴 목록의 항목' },
  { id: 'menu-on', label: '고른 메뉴', hint: '목록에서 고른 항목' },
  { id: 'tab', label: '탭', hint: '탭 줄' },
  { id: 'badge', label: '뱃지', hint: '상태를 알리는 작은 표시' },
  { id: 'number', label: '숫자', hint: '금액과 통계' },
  { id: 'code', label: '코드', hint: '고정폭으로 적는 글자' },
]

/**
 * 모양마다의 기본 예시 문구. 줄에 예시 문구를 적지 않았을 때 쓴다.
 * 여러 개를 늘어놓는 모양(버튼, 메뉴, 탭, 뱃지, 숫자)은 쉼표와 빈칸(", ")으로 나눠 적는다. "₩48,000"처럼 쉼표 뒤에 빈칸이 없으면 나뉘지 않는다.
 */
export const SHAPE_WORDS: Record<TypeShape, string> = {
  title: '주문 관리',
  paragraph: '한라봉 선물세트는 오후 2시 전에 주문하면 당일 출고됩니다. 받는 분의 주소와 연락처를 다시 확인해 주세요.',
  caption: '3kg · 12~15과 · 제주 서귀포 · 무료 배송',
  button: '저장, 취소',
  field: '받는 분',
  menu: '주문 관리, 상품, 고객',
  'menu-on': '주문 관리',
  tab: '주문, 상품, 고객',
  badge: '배송 중, 신규',
  number: '₩48,000, 318건',
  code: 'ORD-2024-0318',
}

/** 여러 개를 늘어놓는 모양인지. 그런 모양은 예시 문구를 ", "로 나눠 하나씩 그린다. */
export const isListShape = (shape: TypeShape) => ['button', 'menu', 'tab', 'badge', 'number'].includes(shape)

/** 모양을 적지 않은 조합의 모양. 이름에서 짐작하고, 짐작할 수 없으면 묶음의 첫 모양이다. */
export function guessTypeShape(short: string, use: TypeUse): TypeShape {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (has('menu', 'nav', 'sidebar')) return has('strong', 'active', 'selected', 'current', 'on') ? 'menu-on' : 'menu'
  if (has('tab', 'tabs')) return 'tab'
  if (has('badge', 'tag', 'chip', 'pill')) return 'badge'
  if (has('button', 'btn', 'action')) return 'button'
  if (has('label', 'field', 'input', 'form')) return 'field'
  if (has('code', 'mono', 'kbd')) return 'code'
  if (has('numeric', 'number', 'num', 'stat', 'price', 'amount', 'data')) return 'number'
  if (has('caption', 'overline', 'eyebrow', 'helper', 'hint', 'footnote', 'meta', 'legal')) return 'caption'
  if (has('display', 'title', 'heading', 'headline', 'subtitle', 'hero', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6')) return 'title'
  return ({ heading: 'title', body: 'paragraph', support: 'caption', control: 'button', data: 'number' } as const)[use]
}

// 묶음 이름 뒤에 반드시 쌍점이 온다. "본문"처럼 묶음 이름과 같은 설명을 묶음으로 잘못 읽어 설명을 잃지 않게 하려는 것이다.
// 묶음 뒤의 괄호는 예시의 모양이다. "컨트롤(메뉴): 왼쪽 메뉴의 항목". 모양을 직접 고른 조합에만 적힌다.
// 설명 뒤에 " | "로 이어 적은 것은 예시 문구다. "컨트롤(메뉴): 왼쪽 메뉴의 항목 | 색상, 의미 색, 글꼴". 예시에 그 시스템이 실제로 쓰는 말을 넣으려는 것이다.
const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다. 손으로 적은 주석은 빈칸이 하나 빠지거나 더 들어가기 쉽고, 문구가 빈 예시는 세로줄 둘이 붙어 적힌다.
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const NOTE = new RegExp(`^(${TYPE_USES.map((u) => u.label).join('|')})(?:\\((${TYPE_SHAPES.map((u) => u.label).join('|')})\\))?\\s*:\\s*(.*)$`)

/** 예시 하나. 어떤 자리에 놓을지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type TypeExample = { shape: TypeShape; words: string }

const SHAPE_HEAD = new RegExp(`^(${TYPE_SHAPES.map((u) => u.label).join('|')})\\s*:\\s*(.*)$`)

/**
 * 주석에서 묶음, 예시의 모양, 설명을 읽는다. "제목: 화면의 제목"처럼 묶음으로 시작하지 않으면 주석 전체가 설명이고 묶음은 이름에서 짐작한다.
 * shape는 실제로 그릴 모양이고, picked는 주석에 직접 적혀 있던 모양이다(없으면 undefined. 그때 shape는 짐작한 것이다).
 * words는 직접 적어 둔 예시 문구다(없으면 ''. 그때는 모양의 기본 문구로 그린다).
 * more는 둘째부터의 예시다. 한 조합이 여러 자리에 쓰이면(패널의 제목이자 구역의 제목) 자리마다 예시를 하나씩 둔다.
 * "제목: 패널의 제목, 구역의 제목 | ink | 제목: 쓰이는 곳"처럼 " | "로 이어 적고, 둘째부터는 앞에 모양을 적는다.
 */
export function readTypeNote(note: string | undefined, short: string): { use: TypeUse; shape: TypeShape; picked?: TypeShape; text: string; words: string; more: TypeExample[] } {
  const all = (note ?? '').trim()
  const m = NOTE.exec(all.replace(/^조작(?=\s*[(:])/, '컨트롤'))
  const found = m && TYPE_USES.find((u) => u.label === m[1])
  const use = found ? found.id : guessTypeUse(short)
  const picked = found && m![2] ? TYPE_SHAPES.find((u) => u.label === m![2])?.id : undefined
  const shape = picked ?? guessTypeShape(short, use)
  // 예시 문구는 묶음을 적은 주석에서만 읽는다. 묶음 없이 적힌 예전 설명에 " | "가 들어 있어도 설명으로 둔다.
  const parts = found ? m![3].split(MARK).map((p) => p.trim()) : [all]
  const more = parts.slice(2).map((p): TypeExample => {
    const head = SHAPE_HEAD.exec(p)
    const own = head && TYPE_SHAPES.find((u) => u.label === head[1])
    return own ? { shape: own.id, words: head![2].trim() } : { shape, words: p }
  })
  return { use, shape, ...(picked ? { picked } : {}), text: parts[0], words: parts[1] ?? '', more }
}

/** 주석에 적을 글자. 첫 예시의 모양은 직접 고른 것만 적는다. 주석을 끝내는 기호와 줄바꿈은 파일을 깨뜨리므로 뺀다. */
export function writeTypeNote(use: TypeUse, text: string, shape?: TypeShape, words = '', more: TypeExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  // 설명과 문구 안의 " | "는 예시를 나누는 표시와 헷갈리므로 " / "로 바꿔 적는다.
  const clean = tidy(text)
  const head = shape ? `${useLabel(use)}(${TYPE_SHAPES.find((u) => u.id === shape)!.label})` : useLabel(use)
  const rest = more.map((e) => `${TYPE_SHAPES.find((u) => u.id === e.shape)!.label}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [clean, ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  return body ? `${head}: ${body}` : `${head}:`
}

const isStyle = (t: Token) => STYLE.matches(t.name)
const typeUseOf = (t: Token) => readTypeNote(t.note, t.name.slice(STYLE.prefix.length)).use

/**
 * 의미 글꼴을 묶음별로 묶는다. 묶음의 순서는 파일에서 그 묶음이 처음 나오는 순서이고, 묶음 안의 순서도 파일에 적힌 순서다.
 * 순서를 따로 저장하지 않고 파일의 순서가 곧 판의 순서다(의미 색과 같다).
 */
export function typeGroups(tokens: Token[]): { use: TypeUse; items: Token[] }[] {
  const groups: { use: TypeUse; items: Token[] }[] = []
  for (const t of tokens) {
    if (!isStyle(t)) continue
    const use = typeUseOf(t)
    const group = groups.find((g) => g.use === use)
    if (group) group.items.push(t)
    else groups.push({ use, items: [t] })
  }
  return groups
}

/**
 * 묶음의 순서대로 의미 글꼴을 다시 늘어놓아, 값 목록에서 의미 글꼴이 있던 자리들에 차례로 넣는다. 다른 값의 자리는 그대로다.
 * 의미 글꼴 뒤에 붙는 글자 사이 값(--type-이름--letter-spacing)은 여기서 옮기지 않는다. 저장할 때 syncTypes가 제 의미 글꼴 바로 뒤에 다시 놓는다.
 */
function placeTypes(tokens: Token[], groups: { items: Token[] }[]): Token[] {
  const sorted = groups.flatMap((g) => g.items)
  let k = 0
  return tokens.map((t) => (isStyle(t) ? sorted[k++] : t))
}

/** 묶음을 통째로 옮긴다. before 묶음의 앞에 놓고, null이면 맨 뒤에 놓는다. */
export function moveTypeGroup(tokens: Token[], use: TypeUse, before: TypeUse | null): Token[] {
  const groups = typeGroups(tokens)
  const moving = groups.find((g) => g.use === use)
  if (!moving || use === before) return tokens
  const rest = groups.filter((g) => g !== moving)
  const at = before === null ? rest.length : rest.findIndex((g) => g.use === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  return placeTypes(tokens, rest)
}

/** 의미 글꼴 하나를 같은 묶음 안에서 옮긴다. before의 앞에 놓고, null이면 묶음의 맨 뒤에 놓는다. */
export function moveType(tokens: Token[], name: string, before: string | null): Token[] {
  const groups = typeGroups(tokens)
  const group = groups.find((g) => g.items.some((t) => t.name === name))
  if (!group || name === before) return tokens
  const moving = group.items.find((t) => t.name === name)!
  const rest = group.items.filter((t) => t !== moving)
  const at = before === null ? rest.length : rest.findIndex((t) => t.name === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  group.items = rest
  return placeTypes(tokens, groups)
}

/** 고른 의미 글꼴들을 같은 묶음 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. 묶음의 끝에 닿으면 그대로 둔다. */
export function shiftTypes(tokens: Token[], names: string[], dir: 1 | -1): Token[] {
  const groups = typeGroups(tokens)
  for (const g of groups) {
    const order = g.items.map((_, i) => i).filter((i) => names.includes(g.items[i].name))
    if (dir === 1) order.reverse()
    for (const i of order) {
      const j = i + dir
      if (j < 0 || j >= g.items.length || names.includes(g.items[j].name)) continue
      ;[g.items[i], g.items[j]] = [g.items[j], g.items[i]]
    }
  }
  return placeTypes(tokens, groups)
}

/**
 * 판 안의 순서를 기본으로 돌려놓는다.
 * 묶음은 제목, 본문, 보조, 컨트롤, 숫자·코드 순서. 묶음 안에서는 큰 글자부터, 같은 크기면 굵은 것부터 놓는다.
 * 크기나 굵기를 숫자로 읽을 수 없는 것(가리키는 값이 없어졌거나 clamp()로 적은 크기)은 맨 뒤에 둔다. 조건이 같으면 지금 순서 그대로다.
 */
export function defaultTypeOrder(tokens: Token[]): Token[] {
  const rank = (use: TypeUse) => TYPE_USES.findIndex((u) => u.id === use)
  const key = (t: Token) => {
    const look = lookOf(tokens, t.value, t.name)
    const size = look?.size ? px(look.size) : NaN
    const weight = look?.weight ? Number(look.weight) : NaN
    return { size: Number.isNaN(size) ? -1 : size, weight: Number.isNaN(weight) ? -1 : weight }
  }
  const groups = typeGroups(tokens).sort((a, b) => rank(a.use) - rank(b.use))
  for (const g of groups) {
    const keys = new Map(g.items.map((t) => [t, key(t)]))
    g.items = [...g.items].sort((a, b) => keys.get(b)!.size - keys.get(a)!.size || keys.get(b)!.weight - keys.get(a)!.weight)
  }
  return placeTypes(tokens, groups)
}
