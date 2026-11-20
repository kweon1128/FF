import type { Token } from './api'

/**
 * 추가 창에서 가리키는 값으로 처음 골라 두는 것. 고를 수 있는 값(names) 가운데 흔히 쓰는 길이(px)에 가장 가까운 값의 이름이다.
 * 고를 것이 없으면 null이다(그때는 칸에 "고르기"가 보인다).
 */
export function nearestRef(tokens: Token[], names: string[], px: number): string | null {
  let best: string | null = null
  let gap = Infinity
  for (const name of names) {
    const length = parseFloat(tokens.find((t) => t.name === name)?.value ?? '')
    if (!Number.isFinite(length)) continue
    const away = Math.abs(length - px)
    if (away < gap) {
      gap = away
      best = name
    }
  }
  return best
}

/** 추가 창의 이름 칸에 채울 이름. 그 이름의 값이 이미 있으면 빈 글자다(같은 쓰임이 이미 있으니 이름을 직접 지어야 한다). */
export const freeName = (tokens: Token[], prefix: string, name: string | undefined) => (name && !tokens.some((t) => t.name === prefix + name) ? name : '')
