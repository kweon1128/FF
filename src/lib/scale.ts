// 색 하나에서 50~950의 11단계를 만든다.
// 눈에 보이는 밝기가 고르게 나뉘는 OKLCH 색 공간에서, 기준 색의 색조는 그대로 두고 밝기와 선명함만 단계별로 바꾼다.

import { hexToLch, lchToHex } from './color'

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

/** 단계별 밝기(0 검정 ~ 1 흰색)와 선명함의 비율. 흔히 쓰는 팔레트들의 흐름을 따른 값이다. */
const LIGHTNESS: Record<number, number> = { 50: 0.975, 100: 0.94, 200: 0.885, 300: 0.81, 400: 0.71, 500: 0.62, 600: 0.54, 700: 0.46, 800: 0.39, 900: 0.33, 950: 0.25 }
const CHROMA: Record<number, number> = { 50: 0.12, 100: 0.25, 200: 0.45, 300: 0.7, 400: 0.92, 500: 1, 600: 1, 700: 0.92, 800: 0.8, 900: 0.68, 950: 0.5 }

/** 색의 밝기에 가장 가까운 단계. 밝은 색이면 낮은 단계, 어두운 색이면 높은 단계가 나온다. */
export function nearestStep(hex: string): number {
  const { l } = hexToLch(hex.toLowerCase())
  return SCALE_STEPS.reduce((best, s) => (Math.abs(LIGHTNESS[s] - l) < Math.abs(LIGHTNESS[best] - l) ? s : best))
}

/** 그 단계의 보통 밝기를 가진 회색. 색을 아직 정하지 않았을 때의 자리 채움으로 쓴다. 50~950이 아니면 null. */
export function grayOf(step: number): string | null {
  return step in LIGHTNESS ? lchToHex({ l: LIGHTNESS[step], c: 0, h: 0 }) : null
}

/**
 * 기준 색(#rrggbb)과 그 색의 단계를 받아 11단계의 색(#rrggbb)을 만든다. 기준 단계는 받은 색 그대로다.
 * 기준 색이 그 단계의 보통 밝기보다 밝거나 어두우면, 나머지 단계도 그만큼 당겨서 흐름이 끊기지 않게 한다.
 */
export function makeScale(hex: string, step: number): Record<number, string> {
  const base = hexToLch(hex.toLowerCase())
  const at = LIGHTNESS[step]
  return Object.fromEntries(
    SCALE_STEPS.map((s) => {
      if (s === step) return [s, hex.toLowerCase()]
      const t = LIGHTNESS[s]
      const l = t > at ? base.l + ((t - at) * (1 - base.l)) / (1 - at) : (base.l * t) / at
      return [s, lchToHex({ l, c: (base.c * CHROMA[s]) / CHROMA[step], h: base.h })]
    }),
  )
}
