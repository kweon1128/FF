// 움직임(시간, 이징, 지연, 애니메이션): 종류와 예시의 모양, 값을 읽고 쓰는 것.
// 층은 하나다. 효과처럼 값에 쓰임의 이름을 붙인다(glide, fade). 움직임은 개수가 적고 한 값이 한 쓰임에만 쓰여서 재료와 쓰임을 두 층으로 나눌 것이 없고,
// 이징은 숫자 하나가 아니라 곡선(숫자 넷)이라 "값이 곧 이름"인 토대를 만들 수 없다.
// 시간의 앞머리는 Tailwind가 읽는 --transition-duration-다(duration-이름. --duration-은 읽지 않는다). 이징은 --ease-(ease-이름), 지연은 --transition-delay-(delay-이름), 애니메이션은 --animate-(animate-이름)다.
//   --transition-duration-glide: 300ms; /* 시간(이동): 캔버스가 판으로 미끄러져 가는 시간 | 의미 색 */
//   --animate-loading: spin 1000ms linear infinite; /* 애니메이션(로딩 버튼): 저장하는 동안 도는 표시 | 저장 중 */

import type { Kind } from './catalog'
import type { KindShape } from './kindnote'
import { KEYFRAMES } from './keyframes'

export type MotionKind = 'duration' | 'ease' | 'delay' | 'animate'

/** 주석 맨 앞에 적는 종류의 이름. */
export const MOTION_TITLES: Record<MotionKind, string> = { duration: '시간', ease: '이징', delay: '지연', animate: '애니메이션' }

export const isMotionKind = (kind: Kind) => kind.id === 'duration' || kind.id === 'ease' || kind.id === 'delay' || kind.id === 'animate'

/**
 * 예시의 모양. 그 움직임으로 무엇이 움직이는지다. 화면에서 실제로 움직이는 것들이다.
 * 시간과 이징은 같은 모양을 쓴다(이동, 바탕, 창, 알림, 접기, 커짐). 지연과 애니메이션은 저마다의 모양이 있다.
 */
export type MotionShape = 'move' | 'fade' | 'dialog' | 'toast' | 'fold' | 'scale' | 'stagger' | 'hint' | 'spinner' | 'skeleton' | 'dot' | 'enter' | 'field'

export const MOTION_SHAPES: KindShape<MotionShape>[] = [
  { id: 'move', label: '이동', hint: '화면이 그 자리로 미끄러져 감' },
  { id: 'fade', label: '바탕', hint: '마우스를 올린 바탕이 나타남' },
  { id: 'dialog', label: '창', hint: '창이 나타남' },
  { id: 'toast', label: '알림', hint: '알림이 올라옴' },
  { id: 'fold', label: '접기', hint: '접힌 구역이 펼쳐짐' },
  { id: 'scale', label: '커짐', hint: '마우스를 올린 카드가 커짐' },
]

/** 지연의 모양. 무엇이 얼마 뒤에 움직이기 시작하는지다. */
export const DELAY_SHAPES: KindShape<MotionShape>[] = [
  { id: 'stagger', label: '차례', hint: '줄이 하나씩 차례로 또렷해짐' },
  { id: 'hint', label: '도움말', hint: '마우스를 올리고 잠깐 뒤에 뜸' },
]

/** 애니메이션의 모양. 스스로 움직이는 것이 무엇인지다. */
export const ANIMATE_SHAPES: KindShape<MotionShape>[] = [
  { id: 'spinner', label: '로딩 버튼', hint: '기다리는 동안 도는 표시' },
  { id: 'skeleton', label: '자리 표시', hint: '불러오는 동안 깜박이는 자리' },
  { id: 'dot', label: '알림 점', hint: '새 소식을 알리는 점' },
  { id: 'enter', label: '알림', hint: '나타나는 알림' },
  { id: 'field', label: '입력칸', hint: '잘못 적어 흔들리는 칸' },
]

/** 모양마다의 기본 예시 문구(", "로 나눈다). 바탕은 메뉴의 줄들, 창은 버튼의 말과 창의 제목, 접기는 구역의 제목과 그 안의 줄들, 도움말은 버튼의 말과 도움말이다. */
export const MOTION_WORDS: Record<MotionShape, string> = {
  move: '첫째',
  fade: '첫째, 둘째, 셋째',
  dialog: '삭제, 삭제할까요?',
  toast: '저장했어요',
  fold: '코드, 첫째, 둘째',
  scale: '카드 제목',
  stagger: '첫째, 둘째, 셋째',
  hint: '저장, 지금까지 고친 것을 저장해요',
  spinner: '저장 중',
  skeleton: '',
  dot: '알림',
  enter: '저장했어요',
  field: '이름, 값',
}

/** 시간을 ms로 읽는다(300ms, 0.3s). 읽을 수 없으면 NaN. */
export function msOf(value: string): number {
  const m = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim())
  return m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : NaN
}

/** 이름으로 적는 곡선(CSS의 낱말)과 그 네 숫자. */
const KEYWORDS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
}

/** 곡선의 네 숫자(x1, y1, x2, y2). cubic-bezier(…)나 CSS의 낱말(ease-out)을 읽는다. 다른 꼴(steps(), linear(…))이면 null. */
export function parseCurve(value: string): [number, number, number, number] | null {
  const v = value.trim()
  if (v in KEYWORDS) return KEYWORDS[v]
  const m = /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/.exec(v)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : null
}

/** 네 숫자를 곡선 값으로 적는다. 가로(x1, x2)는 0과 1 사이여야 한다. 아니면 null. */
export function writeCurve(n: number[]): string | null {
  if (n.length !== 4 || n.some((x) => !Number.isFinite(x)) || n[0] < 0 || n[0] > 1 || n[2] < 0 || n[2] > 1) return null
  return `cubic-bezier(${n.join(', ')})`
}

/** 끊기는 움직임(steps(4, end))의 단계 수와 끊는 자리. 그 꼴이 아니면 null. */
export function parseSteps(value: string): { count: number; at: string } | null {
  const m = /^steps\(\s*(\d+)\s*(?:,\s*([a-z-]+)\s*)?\)$/.exec(value.trim())
  return m && Number(m[1]) > 0 ? { count: Number(m[1]), at: m[2] ?? 'end' } : null
}

/**
 * "추가"에서 고르는 곡선. 값은 만든 뒤에 패널에서 고친다.
 * 앞의 넷은 매끄러운 곡선(네 숫자)이고, 끊김은 몇 단계로 뚝뚝 끊겨 움직이는 것(steps), 튕김은 끝에서 여러 번 튕기는 것이다(linear. 네 숫자의 곡선으로는 한 번 넘었다 돌아오는 것까지만 된다).
 */
export const CURVE_PRESETS: { id: string; label: string; hint: string; value: string }[] = [
  { id: 'out', label: '감속', hint: '빠르게 출발해 천천히 멈춤', value: 'cubic-bezier(0, 0, 0.58, 1)' },
  { id: 'in', label: '가속', hint: '천천히 출발해 빨라짐', value: 'cubic-bezier(0.42, 0, 1, 1)' },
  { id: 'in-out', label: '가감속', hint: '천천히 출발해 천천히 멈춤', value: 'cubic-bezier(0.42, 0, 0.58, 1)' },
  { id: 'linear', label: '일정', hint: '처음부터 끝까지 같은 빠르기', value: 'cubic-bezier(0, 0, 1, 1)' },
  { id: 'steps', label: '끊김', hint: '몇 단계로 끊겨 움직임', value: 'steps(4, end)' },
  { id: 'bounce', label: '튕김', hint: '끝에서 여러 번 튕김', value: 'linear(0, 0.063, 0.25 18.2%, 1 36.4%, 0.813, 0.75, 0.813, 1, 0.938, 1, 0.984, 1)' },
]

/** 값이 준비된 곡선 가운데 하나면 그 id. 낱말로 적은 곡선(linear, ease-out)도 같은 네 숫자의 곡선으로 본다. */
export function curvePresetOf(value: string): string | null {
  const n = parseCurve(value)
  return CURVE_PRESETS.find((p) => p.value === value.trim() || (n !== null && parseCurve(p.value)?.join() === n.join()))?.id ?? null
}

/** 애니메이션 값 하나. 움직임(준비된 것의 이름), 한 번 도는 시간, 이징, 되풀이(횟수나 계속). */
export type Animation = { name: string; ms: number; ease: string; count: number | 'infinite' }

/** 괄호 밖의 빈칸에서 나눈다(cubic-bezier(0, 0, 1, 1) 안의 빈칸에서는 나누지 않는다). */
function words(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let now = ''
  for (const ch of value.trim()) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (/\s/.test(ch) && depth === 0) {
      if (now) out.push(now)
      now = ''
    } else now += ch
  }
  if (now) out.push(now)
  return out
}

/** 애니메이션 값을 읽는다("spin 1000ms linear infinite"). 준비된 움직임이 아니거나 네 낱말이 아니면 null. 그때는 글자로 고친다. */
export function parseAnimation(value: string): Animation | null {
  const parts = words(value)
  if (parts.length !== 4) return null
  const [name, time, ease, times] = parts
  const ms = msOf(time)
  const count = times === 'infinite' ? 'infinite' : /^\d+$/.test(times) && Number(times) > 0 ? Number(times) : null
  if (!KEYFRAMES.some((k) => k.id === name) || Number.isNaN(ms) || count === null) return null
  return { name, ms, ease, count }
}

export const writeAnimation = (a: Animation) => `${a.name} ${a.ms}ms ${a.ease} ${a.count}`
