// 예시 그림에 쓰는 색. 보여 주는 디자인 시스템의 의미 색에서 찾는다.
// 예시는 그 시스템의 실제 요소(버튼, 입력칸, 메뉴 줄)를 그리는 것이라, 테두리와 마우스를 올린 바탕, 옅은 글자도 그 시스템의 색이어야 실제 화면과 같아 보인다.
// 그런 이름의 의미 색이 없는 시스템에서는 기본 글자 색을 바탕에 섞어 대신한다.

import type { Token } from './api'
import { resolveColor, surroundings } from './roles'

export type SampleColors = {
  /** 기본 바탕과 기본 글자. */
  surface: string
  ink: string
  /** 옅은 글자(고르지 않은 메뉴 줄, 바탕 없는 버튼). */
  soft: string
  /** 더 옅은 글자(입력칸의 이름표). */
  faint: string
  /** 테두리와 구분선. */
  line: string
  /** 마우스를 올린 바탕, 칩의 바탕. */
  hover: string
  /** 곁에 놓이는 것을 대신 그리는 막대. */
  filler: string
  /** 주요 버튼의 바탕과 그 위의 글자. */
  primary: string
  onPrimary: string
  /** 선택과 초점의 색, 그 색을 채운 표시 위의 글자. */
  selection: string
  onSelection: string
  /** 치수선과 안내선의 색. */
  guide: string
}

export function sampleColors(tokens: Token[]): SampleColors {
  const around = surroundings(tokens)
  const mix = (amount: number) => `color-mix(in oklab, ${around.ink} ${amount}%, ${around.surface})`
  const named = (...names: string[]) => {
    for (const n of names) {
      const t = tokens.find((x) => x.name === `--color-${n}`)
      const color = t && resolveColor(tokens, t.value)
      if (color) return color
    }
    return null
  }
  const selection = named('selection', 'focus', 'ring', 'primary') ?? around.ink
  return {
    ...around,
    soft: named('ink-soft', 'text-soft', 'text-muted', 'muted') ?? mix(56),
    faint: named('ink-faint', 'text-faint', 'text-subtle', 'subtle') ?? mix(48),
    line: named('hairline', 'border', 'line', 'divider', 'outline') ?? mix(16),
    hover: named('hover', 'surface-hover', 'muted-surface') ?? mix(8),
    filler: mix(16),
    primary: named('primary', 'accent', 'brand') ?? around.ink,
    onPrimary: named('on-primary', 'primary-foreground') ?? around.surface,
    selection,
    onSelection: named('on-selection', 'on-primary') ?? around.surface,
    guide: named('guide') ?? selection,
  }
}
