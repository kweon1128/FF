// 효과(그림자, 투명도, 흐림): 설명과 예시를 주석에서 읽고 쓰는 것, 그리고 그림자 값을 겹으로 나누어 읽고 쓰는 것.
// 효과에는 의미 판을 따로 두지 않는다. 그림자는 개수가 적고 한 값이 한 쓰임에만 쓰여서(떠 있는 것, 창) 재료와 쓰임을 두 층으로 나눌 이유가 약하다.
// 그래서 효과 판의 값에 쓰임의 이름(float, dialog)을 붙이고, 의미 색·의미 글꼴처럼 설명과 예시를 값 뒤의 주석에 적는다.
//   --shadow-float: 0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06); /* 그림자(메뉴): 고르는 목록 | 이름 바꾸기, 복제, 삭제 | 알림: 저장했어요 */

export type EffectKind = 'shadow' | 'opacity' | 'blur'

/** 주석 맨 앞에 적는 종류의 이름. 의미 색의 역할, 의미 글꼴의 묶음이 놓이는 자리다. */
export const EFFECT_TITLES: Record<EffectKind, string> = { shadow: '그림자', opacity: '투명도', blur: '흐림' }

export const isEffectKind = (id: string): id is EffectKind => id === 'shadow' || id === 'opacity' || id === 'blur'

/**
 * 예시의 모양. 그 효과를 어떤 자리에 놓아 보여 줄지다. 종류마다 고를 수 있는 모양이 다르다.
 * 적어 두지 않은 값은 이름에서 짐작하고(float는 메뉴, dialog는 창, disabled는 비활성), 짐작할 수 없으면 종류의 마지막 모양을 쓴다.
 */
export type EffectShape = 'menu' | 'dialog' | 'toast' | 'card' | 'well' | 'disabled' | 'drag' | 'scrim' | 'layer' | 'glass' | 'bar'

export const EFFECT_SHAPES: { id: EffectShape; kind: EffectKind; label: string; hint: string }[] = [
  { id: 'menu', kind: 'shadow', label: '메뉴', hint: '떠 있는 목록' },
  { id: 'dialog', kind: 'shadow', label: '창', hint: '화면 위에 뜨는 창' },
  { id: 'toast', kind: 'shadow', label: '알림', hint: '잠깐 뜨는 알림' },
  { id: 'card', kind: 'shadow', label: '카드', hint: '살짝 떠 있는 면' },
  { id: 'well', kind: 'shadow', label: '입력칸', hint: '안으로 들어가 보이는 칸' },
  { id: 'disabled', kind: 'opacity', label: '비활성', hint: '누를 수 없는 버튼' },
  { id: 'drag', kind: 'opacity', label: '끌기', hint: '끌어 옮기는 중인 줄' },
  { id: 'scrim', kind: 'opacity', label: '배경 가림', hint: '창 뒤의 화면을 가리는 막' },
  { id: 'layer', kind: 'opacity', label: '겹침', hint: '뒤가 비치는 면' },
  { id: 'glass', kind: 'blur', label: '유리', hint: '뒤가 흐려 보이는 면' },
  { id: 'bar', kind: 'blur', label: '상단 바', hint: '내용 위에 떠 있는 반투명 막대' },
]

/** 모양마다의 기본 예시 문구. 글자가 없는 모양(배경 가림, 겹침, 유리)은 비어 있다. 메뉴와 끌기는 ", "로 나눠 줄마다 적는다. 상단 바는 막대의 제목과 그 아래 내용의 줄들이다. */
export const EFFECT_WORDS: Record<EffectShape, string> = {
  menu: '이름 바꾸기, 복제, 삭제',
  dialog: '삭제할까요?, -, 취소, 삭제',
  toast: '저장했어요',
  card: '카드 제목',
  well: '이름',
  disabled: '저장',
  drag: '첫째, 둘째, 셋째',
  scrim: '',
  layer: '',
  glass: '',
  bar: '설정, 이름, 글꼴, 색상',
}

/**
 * "추가"로 값을 만들 때, 고른 쓰임마다 채워 넣는 이름·추천 값·설명.
 * 효과는 쓰임으로 이름 붙이므로 단계 이름(sm, md…)이 아니라 쓰임의 이름으로 만든다. 값은 만든 뒤에 패널에서 고친다.
 * 그림자는 두 겹이다. 가까이 짧게 지는 겹과 멀리 넓게 퍼지는 겹. 멀리 뜬 것일수록 뒤의 겹이 넓고 진하다(카드 < 메뉴 < 알림 < 창).
 */
export const EFFECT_PRESETS: Record<EffectShape, { name: string; value: string; text: string }> = {
  menu: { name: 'float', value: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)', text: '고르는 목록, 떠 있는 메뉴' },
  dialog: { name: 'dialog', value: '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 32px rgb(0 0 0 / 0.1)', text: '화면 위에 뜨는 창' },
  toast: { name: 'toast', value: '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.08)', text: '잠깐 떴다 사라지는 알림' },
  card: { name: 'card', value: '0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04)', text: '살짝 떠 있는 면' },
  // 안쪽 그림자는 한 겹이다. 위쪽 가장자리 안에 짧게 져서 칸이 안으로 들어가 보인다.
  well: { name: 'well', value: 'inset 0 1px 2px rgb(0 0 0 / 0.08)', text: '안으로 들어가 보이는 입력칸' },
  disabled: { name: 'disabled', value: '0.4', text: '누를 수 없는 버튼과 입력칸' },
  drag: { name: 'dragging', value: '0.4', text: '끌어 옮기는 중인 줄' },
  scrim: { name: 'scrim', value: '0.4', text: '창 뒤의 화면을 가리는 막' },
  layer: { name: 'layer', value: '0.8', text: '뒤가 비치는 면' },
  glass: { name: 'glass', value: '12px', text: '뒤가 흐려 보이는 면' },
  bar: { name: 'bar', value: '8px', text: '내용 위에 떠 있는 반투명 상단 바' },
}

/** 모양을 적지 않은 값의 모양. */
export function guessEffectShape(kind: EffectKind, short: string): EffectShape {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (kind === 'shadow') {
    if (has('well', 'inset', 'inner', 'sunken', 'pressed')) return 'well'
    if (has('float', 'menu', 'dropdown', 'popover', 'pop', 'overlay')) return 'menu'
    if (has('dialog', 'modal', 'sheet', 'window')) return 'dialog'
    if (has('toast', 'snackbar', 'notice')) return 'toast'
    return 'card'
  }
  if (kind === 'opacity') {
    if (has('disabled', 'muted', 'off', 'inactive')) return 'disabled'
    if (has('dragging', 'drag', 'moving')) return 'drag'
    if (has('scrim', 'overlay', 'backdrop', 'dim')) return 'scrim'
    return 'layer'
  }
  if (has('bar', 'header', 'nav', 'sticky', 'toolbar')) return 'bar'
  return 'glass'
}

/** 예시 하나. 어떤 자리에 놓을지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type EffectExample = { shape: EffectShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(의미 색, 의미 글꼴의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const labelsOf = (kind: EffectKind) => EFFECT_SHAPES.filter((s) => s.kind === kind).map((s) => s.label).join('|')

/**
 * 주석에서 설명과 예시들을 읽는다. "그림자(메뉴): 고르는 목록 | 문구 | 알림: 문구"처럼 종류의 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * shape는 첫 예시를 그릴 모양이고, picked는 주석에 직접 적혀 있던 모양이다(없으면 undefined. 그때 shape는 이름에서 짐작한 것이다).
 */
export function readEffectNote(kind: EffectKind, note: string | undefined, short: string): { text: string; shape: EffectShape; picked?: EffectShape; words: string; more: EffectExample[] } {
  const all = (note ?? '').trim()
  const own = (label: string) => EFFECT_SHAPES.find((s) => s.kind === kind && s.label === label)?.id
  const m = new RegExp(`^${EFFECT_TITLES[kind]}(?:\\((${labelsOf(kind)})\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[1] ? own(m[1]) : undefined
  const shape = picked ?? guessEffectShape(kind, short)
  const parts = m ? m[2].split(MARK).map((p) => p.trim()) : [all]
  const head = new RegExp(`^(${labelsOf(kind)})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).map((p): EffectExample => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? { shape: id, words: h![2].trim() } : { shape, words: p }
  })
  return { text: parts[0], shape, ...(picked ? { picked } : {}), words: parts[1] ?? '', more }
}

/** 주석에 적을 글자. 첫 예시의 모양은 직접 고른 것만 적는다. 설명도 예시도 없으면 빈 글자(주석을 달지 않는다). */
export function writeEffectNote(kind: EffectKind, text: string, shape?: EffectShape, words = '', more: EffectExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: EffectShape) => EFFECT_SHAPES.find((s) => s.id === id)!.label
  const clean = tidy(text)
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  const body = [clean, ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  if (!body && !shape) return ''
  const head = shape ? `${EFFECT_TITLES[kind]}(${label(shape)})` : EFFECT_TITLES[kind]
  return body ? `${head}: ${body}` : `${head}:`
}

/**
 * 그림자 한 겹. 그림자는 겹을 쉼표로 이어 적는다(가까이 짧게 지는 겹과 멀리 넓게 퍼지는 겹).
 * 색은 두 가지로 적는다. 직접 고른 색은 rgb(r g b / 진하기)이고(#rrggbb로 적힌 것도 읽는다), 색상 판의 값을 가리키는 색은
 * color-mix(in srgb, var(--color-이름) 진하기%, transparent)다. 가리키는 색은 색상 판에서 그 색을 바꾸면 따라 바뀐다. ref가 그 값의 이름이다.
 * alpha는 진하기(0~1). 읽을 수 없는 꼴의 색(이름, 다른 var())이면 null로 두고 color를 적힌 그대로 쓴다.
 * 그림자 색은 토대에 없는 색일 수 있다. 검정 4%처럼 순수한 검정을 옅게 쓰는 그림자는 팔레트의 색이 아니라서 직접 적고, 버튼 색을 띤 그림자는 팔레트의 그 색을 가리킨다.
 */
export type ShadowLayer = { inset: boolean; x: number; y: number; blur: number; spread: number; rgb: string; alpha: number | null; color: string; ref: string | null }

const LENGTH = /^(-?\d*\.?\d+)(px)?$/
const RGB_ALPHA = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*(\d*\.?\d+)(%)?)?\s*\)$/
const MIX = /^color-mix\(\s*in srgb\s*,\s*var\(\s*(--color-[a-z0-9-]+)\s*\)\s+(\d*\.?\d+)%\s*,\s*transparent\s*\)$/
const HEX_COLOR = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i

/** #rrggbb를 "r g b"로. */
export const rgbOfHex = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)).join(' ')
/** 겹의 색을 #rrggbb로. 직접 고른 색이 아니면(가리키는 색, 읽을 수 없는 색) null. */
export const hexOfLayer = (l: ShadowLayer) => (l.ref || !l.rgb ? null : '#' + l.rgb.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join(''))

/** 그림자 값을 겹마다 나눈다(괄호 밖의 쉼표에서). 판에서 겹마다 한 줄씩 적을 때도 쓴다. */
export function splitLayers(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')') depth--
    else if (value[i] === ',' && depth === 0) {
      out.push(value.slice(from, i))
      from = i + 1
    }
  }
  out.push(value.slice(from))
  return out.map((s) => s.trim())
}

/** 그림자 값을 겹으로 나눈다. 읽을 수 없는 꼴(none, var(), 단위가 px이 아닌 것)이면 null. 그때는 글자로 고친다. */
export function parseShadow(value: string): ShadowLayer[] | null {
  const layers: ShadowLayer[] = []
  for (const part of splitLayers(value)) {
    let rest = part
    const inset = /^inset\s+/.test(rest)
    if (inset) rest = rest.replace(/^inset\s+/, '')
    const nums: number[] = []
    // 앞에서부터 길이를 넷까지 읽고, 남은 것이 색이다.
    while (nums.length < 4) {
      const m = /^(\S+)(?:\s+|$)/.exec(rest)
      const n = m && LENGTH.exec(m[1])
      if (!n || (!n[2] && Number(n[1]) !== 0)) break
      nums.push(Number(n[1]))
      rest = rest.slice(m![0].length)
    }
    if (nums.length < 2 || !rest.trim()) return null
    const color = rest.trim()
    const c = RGB_ALPHA.exec(color)
    const mix = MIX.exec(color)
    const hex = HEX_COLOR.exec(color)
    const alpha = c ? (c[4] === undefined ? 1 : Number(c[4]) / (c[5] ? 100 : 1)) : mix ? Number(mix[2]) / 100 : hex ? (hex[2] ? Math.round((parseInt(hex[2], 16) / 255) * 100) / 100 : 1) : null
    const rgb = c ? `${c[1]} ${c[2]} ${c[3]}` : hex ? rgbOfHex('#' + hex[1]) : ''
    layers.push({ inset, x: nums[0], y: nums[1], blur: nums[2] ?? 0, spread: nums[3] ?? 0, rgb, alpha, color, ref: mix ? mix[1] : null })
  }
  return layers.length > 0 ? layers : null
}

const len = (n: number) => (n === 0 ? '0' : `${n}px`)

/** 겹들을 그림자 값으로 적는다. 퍼짐이 0이면 적지 않는다. */
export function writeShadow(layers: ShadowLayer[]): string {
  return layers
    .map((l) => {
      const color = l.alpha === null ? l.color : l.ref ? `color-mix(in srgb, var(${l.ref}) ${Math.round(l.alpha * 1000) / 10}%, transparent)` : `rgb(${l.rgb} / ${l.alpha})`
      return `${l.inset ? 'inset ' : ''}${len(l.x)} ${len(l.y)} ${len(l.blur)}${l.spread ? ` ${len(l.spread)}` : ''} ${color}`
    })
    .join(', ')
}

/** "겹 추가"로 생기는 겹. 마지막 겹보다 멀리 넓게 지는 옅은 겹이다. */
export function nextLayer(layers: ShadowLayer[]): ShadowLayer {
  const last = layers[layers.length - 1]
  if (!last) return { inset: false, x: 0, y: 1, blur: 2, spread: 0, rgb: '0 0 0', alpha: 0.04, color: 'rgb(0 0 0 / 0.04)', ref: null }
  return { ...last, y: Math.max(1, last.y * 2), blur: Math.max(2, last.blur * 2) }
}

/** 그림자의 겹들이 가리키는 색상 판의 값 이름들. */
export function shadowRefs(value: string): string[] {
  return (parseShadow(value) ?? []).flatMap((l) => (l.ref ? [l.ref] : []))
}

/** 가리키던 색의 이름이 바뀌면 그림자도 새 이름을 가리키게 한다. 바뀔 것이 없으면 적힌 그대로 돌려준다. */
export function followShadowRefs(value: string, renames: Record<string, string>): string {
  const layers = parseShadow(value)
  if (!layers || !layers.some((l) => l.ref && renames[l.ref])) return value
  return writeShadow(layers.map((l) => (l.ref && renames[l.ref] ? { ...l, ref: renames[l.ref] } : l)))
}

/**
 * 예시를 그릴 때 쓰는 그림자 값. 가리키는 색을 그 시스템의 실제 색으로 바꿔 적는다(hexOf가 이름으로 #rrggbb를 찾는다).
 * 그대로 그리면 var(--color-이름)이 FF 자신의 색을 읽는다. 가리키는 색이 없어진 겹은 보이지 않게 그린다.
 */
export function paintShadow(value: string, hexOf: (name: string) => string | null): string {
  const layers = parseShadow(value)
  if (!layers || !layers.some((l) => l.ref)) return value
  return writeShadow(
    layers.map((l) => {
      if (!l.ref) return l
      const hex = hexOf(l.ref)
      return hex ? { ...l, ref: null, rgb: rgbOfHex(hex) } : { ...l, ref: null, rgb: '0 0 0', alpha: 0 }
    }),
  )
}
