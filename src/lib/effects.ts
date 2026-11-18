// 효과(그림자, 투명도, 흐림): 설명과 예시를 주석에서 읽고 쓰는 것, 그리고 그림자 값을 겹으로 나누어 읽고 쓰는 것.
// 효과에는 의미 판을 따로 두지 않는다. 그림자는 개수가 적고 한 값이 한 쓰임에만 쓰여서(떠 있는 것, 창) 재료와 쓰임을 두 층으로 나눌 이유가 약하다.
// 그래서 효과 판의 값에 쓰임의 이름(float, dialog)을 붙이고, 의미 색·의미 글꼴처럼 설명과 예시를 값 뒤의 주석에 적는다.
//   --shadow-float: 0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06); /* 그림자(메뉴): 드롭다운 목록 | 이름 바꾸기, 복제, 삭제 | 알림: 저장했어요 */

export type EffectKind = 'shadow' | 'opacity' | 'blur'

/** 주석 맨 앞에 적는 종류의 이름. 의미 색의 역할, 의미 글꼴의 묶음이 놓이는 자리다. */
export const EFFECT_TITLES: Record<EffectKind, string> = { shadow: '그림자', opacity: '투명도', blur: '흐림' }

export const isEffectKind = (id: string): id is EffectKind => id === 'shadow' || id === 'opacity' || id === 'blur'

/**
 * 예시의 모양. 그 효과를 어떤 자리에 놓아 보여 줄지다. 종류마다 고를 수 있는 모양이 다르다.
 * 적어 두지 않은 값은 이름에서 짐작하고(float는 메뉴, dialog는 창, disabled는 비활성), 짐작할 수 없으면 종류의 마지막 모양을 쓴다.
 */
export type EffectShape = 'menu' | 'dialog' | 'toast' | 'card' | 'disabled' | 'drag' | 'scrim' | 'layer' | 'glass'

export const EFFECT_SHAPES: { id: EffectShape; kind: EffectKind; label: string; hint: string }[] = [
  { id: 'menu', kind: 'shadow', label: '메뉴', hint: '떠 있는 목록' },
  { id: 'dialog', kind: 'shadow', label: '창', hint: '화면 위에 뜨는 창' },
  { id: 'toast', kind: 'shadow', label: '알림', hint: '잠깐 뜨는 알림' },
  { id: 'card', kind: 'shadow', label: '카드', hint: '살짝 떠 있는 면' },
  { id: 'disabled', kind: 'opacity', label: '비활성', hint: '누를 수 없는 버튼' },
  { id: 'drag', kind: 'opacity', label: '끌기', hint: '끌어 옮기는 중인 줄' },
  { id: 'scrim', kind: 'opacity', label: '배경 가림', hint: '창 뒤의 화면을 가리는 막' },
  { id: 'layer', kind: 'opacity', label: '겹침', hint: '뒤가 비치는 면' },
  { id: 'glass', kind: 'blur', label: '유리', hint: '뒤가 흐려 보이는 면' },
]

/** 모양마다의 기본 예시 문구. 글자가 없는 모양(배경 가림, 겹침, 유리)은 비어 있다. 메뉴와 끌기는 ", "로 나눠 줄마다 적는다. */
export const EFFECT_WORDS: Record<EffectShape, string> = {
  menu: '이름 바꾸기, 복제, 삭제',
  dialog: '삭제할까요?, -, 취소, 삭제',
  toast: '저장했어요',
  card: '카드 제목',
  disabled: '저장',
  drag: '첫째, 둘째, 셋째',
  scrim: '',
  layer: '',
  glass: '',
}

/**
 * "추가"로 값을 만들 때, 고른 쓰임마다 채워 넣는 이름·추천 값·설명.
 * 효과는 쓰임으로 이름 붙이므로 단계 이름(sm, md…)이 아니라 쓰임의 이름으로 만든다. 값은 만든 뒤에 패널에서 고친다.
 * 그림자는 두 겹이다. 가까이 짧게 지는 겹과 멀리 넓게 퍼지는 겹. 멀리 뜬 것일수록 뒤의 겹이 넓고 진하다(카드 < 메뉴 < 알림 < 창).
 */
export const EFFECT_PRESETS: Record<EffectShape, { name: string; value: string; text: string }> = {
  menu: { name: 'float', value: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)', text: '드롭다운 목록, 떠 있는 메뉴' },
  dialog: { name: 'dialog', value: '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 32px rgb(0 0 0 / 0.1)', text: '화면 위에 뜨는 창' },
  toast: { name: 'toast', value: '0 2px 4px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.08)', text: '잠깐 떴다 사라지는 알림' },
  card: { name: 'card', value: '0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04)', text: '살짝 떠 있는 면' },
  disabled: { name: 'disabled', value: '0.4', text: '누를 수 없는 버튼과 입력칸' },
  drag: { name: 'dragging', value: '0.4', text: '끌어 옮기는 중인 줄' },
  scrim: { name: 'scrim', value: '0.4', text: '창 뒤의 화면을 가리는 막' },
  layer: { name: 'layer', value: '0.8', text: '뒤가 비치는 면' },
  glass: { name: 'glass', value: '12px', text: '뒤가 흐려 보이는 면' },
}

/** 모양을 적지 않은 값의 모양. */
export function guessEffectShape(kind: EffectKind, short: string): EffectShape {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (kind === 'shadow') {
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
 * 주석에서 설명과 예시들을 읽는다. "그림자(메뉴): 드롭다운 목록 | 문구 | 알림: 문구"처럼 종류의 이름으로 시작하지 않으면 주석 전체가 설명이다.
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
 * alpha는 진하기(0~1). 색이 rgb(r g b / a) 꼴일 때만 읽고, 다른 꼴(이름, #, var())이면 null로 두고 color를 적힌 그대로 쓴다.
 */
export type ShadowLayer = { inset: boolean; x: number; y: number; blur: number; spread: number; rgb: string; alpha: number | null; color: string }

const LENGTH = /^(-?\d*\.?\d+)(px)?$/
const RGB_ALPHA = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*(\d*\.?\d+)(%)?)?\s*\)$/

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
    const alpha = c ? (c[4] === undefined ? 1 : Number(c[4]) / (c[5] ? 100 : 1)) : null
    layers.push({ inset, x: nums[0], y: nums[1], blur: nums[2] ?? 0, spread: nums[3] ?? 0, rgb: c ? `${c[1]} ${c[2]} ${c[3]}` : '', alpha, color })
  }
  return layers.length > 0 ? layers : null
}

const len = (n: number) => (n === 0 ? '0' : `${n}px`)

/** 겹들을 그림자 값으로 적는다. 퍼짐이 0이면 적지 않는다. */
export function writeShadow(layers: ShadowLayer[]): string {
  return layers
    .map((l) => {
      const color = l.alpha === null ? l.color : `rgb(${l.rgb} / ${l.alpha})`
      return `${l.inset ? 'inset ' : ''}${len(l.x)} ${len(l.y)} ${len(l.blur)}${l.spread ? ` ${len(l.spread)}` : ''} ${color}`
    })
    .join(', ')
}

/** "겹 추가"로 생기는 겹. 마지막 겹보다 멀리 넓게 지는 옅은 겹이다. */
export function nextLayer(layers: ShadowLayer[]): ShadowLayer {
  const last = layers[layers.length - 1]
  if (!last) return { inset: false, x: 0, y: 1, blur: 2, spread: 0, rgb: '0 0 0', alpha: 0.04, color: 'rgb(0 0 0 / 0.04)' }
  return { ...last, y: Math.max(1, last.y * 2), blur: Math.max(2, last.blur * 2) }
}
