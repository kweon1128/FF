// 색 값의 형식을 바꾼다.
// 파일에는 oklch(밝기 선명함 색조)로 저장하고, 화면에서는 사람이 읽고 쓰기 쉬운 #rrggbb로 보여 준다.

/** OKLCH 색. l은 밝기(0~1), c는 선명함(0~0.4쯤), h는 색조(라디안). */
export type Lch = { l: number; c: number; h: number }

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
const byte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
/** 끝에 붙는 0을 떼고 적는다. 1.5000 → 1.5 */
const num = (v: number, digits: number) => Number(v.toFixed(digits)).toString()

/** 0~1의 r, g, b를 OKLCH로. */
function rgbToLch(r: number, g: number, b: number): Lch {
  const [lr, lg, lb] = [r, g, b].map(toLinear)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) }
}

/** #rrggbb를 OKLCH로. 투명도가 붙어 있어도 색 부분만 본다. */
export function hexToLch(hex: string): Lch {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return rgbToLch(r, g, b)
}

/** OKLCH를 0~1의 r, g, b로. 화면(sRGB)이 낼 수 없는 색이면 null. */
function lchToRgb({ l: L, c, h }: Lch): [number, number, number] | null {
  const A = c * Math.cos(h)
  const B = c * Math.sin(h)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  if (rgb.some((v) => v < -0.002 || v > 1.002)) return null
  return rgb.map((v) => fromLinear(Math.min(1, Math.max(0, v)))) as [number, number, number]
}

/** 화면이 낼 수 있는 색인지. 아니면 #으로는 가까운 색만 보여 줄 수 있다. */
export const inGamut = (color: Lch) => lchToRgb(color) !== null

/** OKLCH를 #rrggbb로. 화면이 낼 수 없는 색이면 낼 수 있을 때까지 선명함만 줄인다(밝기와 색조는 지킨다). */
export function lchToHex(color: Lch): string {
  let c = color.c
  let rgb = lchToRgb({ ...color, c })
  while (!rgb && c > 0.0005) {
    c *= 0.97
    rgb = lchToRgb({ ...color, c })
  }
  const [r, g, b] = rgb ?? lchToRgb({ ...color, c: 0 }) ?? [0, 0, 0]
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

/** 0~1 또는 %로 적힌 수. scale은 100%가 뜻하는 값. */
function amount(text: string, scale = 1) {
  return text.endsWith('%') ? (parseFloat(text) / 100) * scale : parseFloat(text)
}

type Parsed = { lch: Lch; alpha: number }

/** oklch(…), #rrggbb(aa), rgb(…), hsl(…)을 읽는다. 읽을 수 없는 값(이름으로 된 색, var(…) 등)은 null. */
function parse(value: string): Parsed | null {
  const text = value.trim().toLowerCase()
  if (HEX.test(text)) return { lch: hexToLch(text), alpha: text.length === 9 ? parseInt(text.slice(7), 16) / 255 : 1 }

  const call = /^(oklch|rgba?|hsla?)\(([^()]+)\)$/.exec(text)
  if (!call) return null
  // 쉼표로 적든 띄어쓰기로 적든, 투명도를 /로 적든 쉼표로 적든 받는다.
  const [main, slash] = call[2].split('/')
  const parts = main.split(/[\s,]+/).filter(Boolean)
  const alphaText = slash?.trim() || parts[3]
  const alpha = alphaText ? Math.min(1, Math.max(0, amount(alphaText))) : 1
  if (parts.length < 3 || parts.slice(0, 3).some((p) => Number.isNaN(parseFloat(p)))) return null

  if (call[1] === 'oklch') {
    return { lch: { l: amount(parts[0]), c: amount(parts[1], 0.4), h: (parseFloat(parts[2]) * Math.PI) / 180 }, alpha }
  }
  if (call[1].startsWith('rgb')) {
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p) / 255))
    return { lch: rgbToLch(r, g, b), alpha }
  }
  // hsl
  const h = ((parseFloat(parts[0]) % 360) + 360) % 360
  const s = amount(parts[1].endsWith('%') ? parts[1] : `${parts[1]}%`)
  const l = amount(parts[2].endsWith('%') ? parts[2] : `${parts[2]}%`)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return { lch: rgbToLch(f(0), f(8), f(4)), alpha }
}

/** 색 값으로 읽을 수 있는지. */
export const isColor = (value: string) => parse(value) !== null

/**
 * 화면에 보여 줄 #rrggbb(투명하면 #rrggbbaa). 읽을 수 없는 값이면 null.
 * 화면이 낼 수 없는 색은 가장 가까운 색이 된다(isApprox로 알 수 있다).
 */
export function toHex(value: string): string | null {
  const color = parse(value)
  if (!color) return null
  const hex = lchToHex(color.lch)
  return color.alpha >= 0.998 ? hex : `${hex}${byte(color.alpha)}`
}

/** #으로 보여 준 색이 근사값인지(화면이 낼 수 없어 가까운 색으로 바꿔 보여 준 것인지). */
export function isApprox(value: string) {
  const color = parse(value)
  return color !== null && !inGamut(color.lch)
}

/**
 * 파일에 저장할 oklch(밝기 선명함 색조). 읽을 수 없는 값이면 그대로 돌려준다.
 * 이미 oklch로 적힌 값은 건드리지 않는다. 다른 형식(#, rgb, hsl)만 바꾼다.
 * 소수점은 #으로 되돌렸을 때 같은 값이 나올 만큼 둔다(밝기·선명함 다섯째 자리, 색조 셋째 자리).
 * 넷째 자리까지만 두면 어두운 색 일부가 되돌렸을 때 끝자리가 1 달라진다.
 */
export function toOklch(value: string): string {
  const text = value.trim()
  if (/^oklch\(/i.test(text)) return text
  const color = parse(text)
  if (!color) return value
  const { l, c, h } = color.lch
  // 회색은 색조가 뜻이 없으므로 0으로 적는다.
  const gray = c < 0.00005
  const hue = (((h * 180) / Math.PI) % 360 + 360) % 360
  const body = `${num(l, 5)} ${gray ? 0 : num(c, 5)} ${gray ? 0 : num(hue, 3)}`
  return color.alpha >= 0.998 ? `oklch(${body})` : `oklch(${body} / ${num(color.alpha, 3)})`
}

/** 화면에 보여 줄 글자. 색으로 읽히면 #, 아니면 적힌 그대로. */
export const showColor = (value: string) => toHex(value) ?? value

/** 사람이 적은 #rrggbb(aa). #을 빼고 적어도 받는다. 색 값이 아니면 null. */
export function asHex(text: string): string | null {
  const t = text.trim().toLowerCase()
  const hex = t.startsWith('#') ? t : `#${t}`
  return HEX.test(hex) ? hex : null
}

/** 색의 밝기(0 검정 ~ 1 흰색). 대비를 셈할 때 쓰는 값이다. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 두 색(#rrggbb)의 대비. 1(같은 색)부터 21(검정과 흰색)까지. 글자가 읽히려면 4.5, 큰 글자는 3이 넘어야 한다(WCAG). */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
