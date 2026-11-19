// 움직임(시간, 이징): 종류와 예시의 모양, 값을 읽고 쓰는 것.
// 층은 하나다. 효과처럼 값에 쓰임의 이름을 붙인다(glide, fade). 움직임은 개수가 적고 한 값이 한 쓰임에만 쓰여서 재료와 쓰임을 두 층으로 나눌 것이 없고,
// 이징은 숫자 하나가 아니라 곡선(숫자 넷)이라 "값이 곧 이름"인 토대를 만들 수 없다.
// 시간의 앞머리는 Tailwind가 읽는 --transition-duration-다(duration-이름. --duration-은 읽지 않는다). 이징은 --ease-다(ease-이름).
//   --transition-duration-glide: 300ms; /* 시간(이동): 캔버스가 판으로 미끄러져 가는 시간 | 의미 색 */

import type { Kind } from './catalog'
import type { KindShape } from './kindnote'

export type MotionKind = 'duration' | 'ease'

/** 주석 맨 앞에 적는 종류의 이름. */
export const MOTION_TITLES: Record<MotionKind, string> = { duration: '시간', ease: '이징' }

export const isMotionKind = (kind: Kind) => kind.id === 'duration' || kind.id === 'ease'

/** 예시의 모양. 그 움직임으로 무엇이 움직이는지다. 화면에서 실제로 움직이는 것들이고, 두 종류가 같은 모양을 쓴다. */
export type MotionShape = 'move' | 'fade' | 'dialog' | 'toast'

export const MOTION_SHAPES: KindShape<MotionShape>[] = [
  { id: 'move', label: '이동', hint: '화면이 그 자리로 미끄러져 감' },
  { id: 'fade', label: '바탕', hint: '마우스를 올린 바탕이 나타남' },
  { id: 'dialog', label: '창', hint: '창이 나타남' },
  { id: 'toast', label: '알림', hint: '알림이 올라옴' },
]

/** 모양마다의 기본 예시 문구. 바탕은 메뉴의 줄들, 창은 버튼의 말과 창의 제목이다(", "로 나눈다). */
export const MOTION_WORDS: Record<MotionShape, string> = {
  move: '첫째',
  fade: '첫째, 둘째, 셋째',
  dialog: '삭제, 삭제할까요?',
  toast: '저장했어요',
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

/** "추가"에서 고르는 곡선. 값은 만든 뒤에 패널에서 숫자로 고친다. */
export const CURVE_PRESETS: { id: string; label: string; hint: string; value: string }[] = [
  { id: 'out', label: '감속', hint: '빠르게 출발해 천천히 멈춤', value: 'cubic-bezier(0, 0, 0.58, 1)' },
  { id: 'in', label: '가속', hint: '천천히 출발해 빨라짐', value: 'cubic-bezier(0.42, 0, 1, 1)' },
  { id: 'in-out', label: '가감속', hint: '천천히 출발해 천천히 멈춤', value: 'cubic-bezier(0.42, 0, 0.58, 1)' },
  { id: 'linear', label: '일정', hint: '처음부터 끝까지 같은 빠르기', value: 'cubic-bezier(0, 0, 1, 1)' },
]
