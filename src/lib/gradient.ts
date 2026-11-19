// 그라데이션(--background-image-이름): 값을 방향과 색들로 나누어 읽고 쓰는 것.
// 효과 판의 네 번째 종류다. 그림자처럼 여러 값으로 이루어진 한 줄짜리 값이고, 층은 하나이며 쓰임의 이름을 붙인다(hero, button).
// 앞머리는 Tailwind가 읽는 --background-image-라서 bg-이름 클래스가 생긴다(bg-hero).
//   --background-image-hero: linear-gradient(135deg, var(--color-blue-500) 0%, #ec4899 100%); /* 그라데이션(바탕): 첫 화면의 바탕 | 제목, 설명 */
// 색은 그림자와 같이 두 가지로 적는다. 색상 판의 값을 가리키거나(var(--color-이름). 그 색을 바꾸면 따라 바뀐다) 직접 적는다(#rrggbb).

/** 색 하나와 그 자리(0~100%). ref는 가리키는 색상 판의 값 이름이고, 없으면 hex가 직접 적은 색이다. */
export type GradientStop = { ref: string | null; hex: string; at: number }
export type Gradient = { angle: number; stops: GradientStop[] }

const COLOR_VAR = /var\(\s*(--color-[a-z0-9-]+)\s*\)/g
const STOP = /^(?:var\(\s*(--color-[a-z0-9-]+)\s*\)|(#[0-9a-f]{6}))\s+(\d*\.?\d+)%$/i

/** 괄호 밖의 쉼표에서 나눈다. */
function parts(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (text[i] === ',' && depth === 0) {
      out.push(text.slice(from, i))
      from = i + 1
    }
  }
  out.push(text.slice(from))
  return out.map((s) => s.trim())
}

/** 그라데이션 값을 읽는다. 곧은 그라데이션에 각도와 "색 자리%"가 둘 이상인 꼴만 읽는다. 다른 꼴(둥근 그라데이션, to right, 자리 없는 색)이면 null. 그때는 글자로 고친다. */
export function parseGradient(value: string): Gradient | null {
  const m = /^linear-gradient\(\s*(-?\d*\.?\d+)deg\s*,([\s\S]+)\)$/.exec(value.trim())
  if (!m) return null
  const stops: GradientStop[] = []
  for (const part of parts(m[2])) {
    const s = STOP.exec(part)
    if (!s) return null
    stops.push({ ref: s[1] ?? null, hex: (s[2] ?? '#000000').toLowerCase(), at: Number(s[3]) })
  }
  return stops.length >= 2 ? { angle: Number(m[1]), stops } : null
}

export function writeGradient(g: Gradient): string {
  return `linear-gradient(${g.angle}deg, ${g.stops.map((s) => `${s.ref ? `var(${s.ref})` : s.hex} ${s.at}%`).join(', ')})`
}

/** 고르는 방향. 각도는 색이 흘러가는 쪽이다(180deg는 위에서 아래로). 이름 옆에 각도를 옅게 적는다. */
export const DIRECTIONS: { id: string; label: string; hint: string }[] = [
  { id: '180', label: '아래로', hint: '180°' },
  { id: '0', label: '위로', hint: '0°' },
  { id: '90', label: '오른쪽으로', hint: '90°' },
  { id: '270', label: '왼쪽으로', hint: '270°' },
  { id: '135', label: '오른쪽 아래로', hint: '135°' },
  { id: '45', label: '오른쪽 위로', hint: '45°' },
  { id: '225', label: '왼쪽 아래로', hint: '225°' },
  { id: '315', label: '왼쪽 위로', hint: '315°' },
]

/** "색 추가"로 생기는 색. 마지막 색과 같은 색을 맨 끝(100%)에 놓고, 마지막이던 색은 그 앞 색과의 가운데로 당긴다. */
export function addStop(g: Gradient): Gradient {
  const last = g.stops[g.stops.length - 1]
  const before = g.stops[g.stops.length - 2]
  const pulled = last.at >= 100 ? { ...last, at: Math.round((before.at + 100) / 2) } : last
  return { ...g, stops: [...g.stops.slice(0, -1), pulled, { ...last, at: 100 }] }
}

/** 값 안에서 가리키는 색상 판의 값 이름들. */
export const colorRefsIn = (value: string) => [...value.matchAll(COLOR_VAR)].map((m) => m[1])

/** 가리키던 색의 이름이 바뀌면 새 이름을 가리키게 한다. */
export const followColorRefs = (value: string, renames: Record<string, string>) => value.replace(COLOR_VAR, (all, name: string) => (renames[name] ? `var(${renames[name]})` : all))

/**
 * 예시를 그릴 때 쓰는 값. 가리키는 색을 그 시스템의 실제 색으로 바꿔 적는다(hexOf가 이름으로 #rrggbb를 찾는다).
 * 그대로 그리면 var(--color-이름)이 FF 자신의 색을 읽는다. 가리키는 색이 없어진 자리는 투명하게 그린다.
 */
export const paintGradient = (value: string, hexOf: (name: string) => string | null) => value.replace(COLOR_VAR, (_, name: string) => hexOf(name) ?? 'transparent')
