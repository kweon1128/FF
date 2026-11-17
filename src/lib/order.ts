// 판 안의 차례. 종류마다 차례를 누가 정하는지가 다르다.
//
// 값에 크기의 차례가 있는 종류(글자 크기, 굵기, 간격…)는 차례가 값에서 정해진다. xs < sm < base, 4 < 8 < 12.
// 사람이 정할 것이 없으므로 값의 크기순으로 저절로 놓고, 손으로는 바꿀 수 없다. 바꿀 수 있게 하면 얻는 것은 없고 base가 xs 위에 놓이는 어긋난 상태만 가능해진다.
//
// 쓰임으로 이름 붙인 종류(의미 색, 의미 글꼴, 효과, 글꼴 종류…)는 어느 것이 먼저인지가 값에서 나오지 않는다. 무엇이 더 중요하고 무엇끼리 가까운지는 사람의 판단이다.
// 그래서 끌어서(또는 Ctrl+[ ])로 바꿀 수 있고, 헝클어졌을 때 돌아갈 "원래대로"가 함께 있다.
//
// 색상 판은 둘이 섞여 있다. 색 목록(gray, red…)은 크기의 차례가 없어 바꿀 수 있고, 목록 안의 단계(50~950)는 숫자순으로 저절로 놓인다.

import type { Token } from './api'
import { KINDS, groupOf, shortName, type Kind } from './catalog'
import { parseShadow } from './effects'

/** 값의 크기순으로 저절로 놓이는 종류. */
const SCALE_IDS = ['size', 'weight', 'leading', 'tracking', 'space', 'radius', 'border', 'breakpoint', 'container', 'z', 'duration']
/** 손으로 차례를 바꿀 수 있는 종류 가운데, 묶음 없이 한 목록으로 놓이는 것(의미 색, 의미 글꼴, 색 목록은 저마다의 방식이 따로 있다). */
const FREE_IDS = ['font', 'shadow', 'opacity', 'blur', 'aspect', 'ease']

export const isScaleKind = (kind: Kind) => SCALE_IDS.includes(kind.id)
export const isFreeKind = (kind: Kind) => FREE_IDS.includes(kind.id)

const kindOfName = (name: string) => Object.values(KINDS).find((k) => k.matches(name))

/** 색 목록 안의 단계인지(gray-500). 예외 색과 의미 색은 아니다. */
const stepOf = (t: Token): number | null => {
  const color = KINDS.color
  if (!color.matches(t.name)) return null
  const short = shortName(color, t.name)
  const list = groupOf(short)
  const n = Number(short.slice(list.length + 1))
  return list && Number.isFinite(n) ? n : null
}

/** 이 값의 차례가 저절로 정해지는지. 그런 값은 단축키로도 옮기지 않는다. */
export function isAutoOrdered(token: Token): boolean {
  const kind = kindOfName(token.name)
  return (kind !== undefined && isScaleKind(kind)) || stepOf(token) !== null
}

/** 값의 크기. 단위가 달라도 견줄 수 있게 px과 ms로 맞춘다. 숫자 하나로 읽을 수 없는 값(clamp(), var())은 NaN. */
function magnitude(value: string): number {
  const m = /^(-?\d*\.?\d+)(px|rem|em|ms|s|%)?$/.exec(value.trim())
  if (!m) return NaN
  const n = Number(m[1])
  return m[2] === 'rem' || m[2] === 'em' ? n * 16 : m[2] === 's' ? n * 1000 : n
}

/** 숫자로 읽을 수 없는 것은 맨 뒤에, 지금 순서 그대로 둔다. */
const byNumber = (a: number, b: number) => (Number.isNaN(a) ? (Number.isNaN(b) ? 0 : 1) : Number.isNaN(b) ? -1 : a - b)

/**
 * 한 종류의 값들을 주어진 차례로 다시 놓는다. 그 종류의 값이 있던 자리들에 차례로 넣고, 다른 값의 자리는 그대로 둔다.
 * 값에 딸린 것(글자 크기의 줄 높이와 글자 사이처럼 이름이 "값의 이름--…"인 것)은 제 값을 따라 함께 옮긴다.
 */
function place(tokens: Token[], isMember: (t: Token) => boolean, sorted: Token[]): Token[] {
  const members = new Set(tokens.filter(isMember).map((t) => t.name))
  const owner = (t: Token) => {
    if (members.has(t.name)) return t.name
    const at = t.name.indexOf('--', 2)
    const head = at === -1 ? '' : t.name.slice(0, at)
    return members.has(head) ? head : null
  }
  const blocks = new Map<string, Token[]>()
  const slots: number[] = []
  tokens.forEach((t, i) => {
    const name = owner(t)
    if (name === null) return
    slots.push(i)
    blocks.set(name, [...(blocks.get(name) ?? []), t])
  })
  // 값이 딸린 것보다 앞에 오게 한다.
  const flat = sorted.flatMap((t) => [...(blocks.get(t.name) ?? [])].sort((a, b) => Number(b.name === t.name) - Number(a.name === t.name)))
  const next = [...tokens]
  slots.forEach((slot, k) => (next[slot] = flat[k]))
  return next
}

/**
 * 차례가 저절로 정해지는 값들을 제자리에 놓는다. 값을 저장할 때마다, 그리고 파일을 읽었을 때 거친다.
 * 크기 있는 종류는 값의 크기순(작은 것부터), 색 목록 안의 단계는 숫자순이다. 이미 그 순서면 받은 목록을 그대로 돌려준다.
 */
export function autoOrder(tokens: Token[]): Token[] {
  let next = tokens
  for (const kind of Object.values(KINDS)) {
    if (!isScaleKind(kind)) continue
    const items = next.filter((t) => kind.matches(t.name))
    if (items.length < 2) continue
    const sorted = [...items].sort((a, b) => byNumber(magnitude(a.value), magnitude(b.value)))
    if (sorted.some((t, i) => t !== items[i])) next = place(next, (t) => kind.matches(t.name), sorted)
  }
  // 색 목록 안의 단계. 목록마다 그 목록의 단계가 있던 자리들 안에서만 다시 놓는다(번호가 아닌 이름은 제자리에 둔다).
  const color = KINDS.color
  const lists = new Map<string, Token[]>()
  for (const t of next) {
    if (stepOf(t) === null) continue
    const list = groupOf(shortName(color, t.name))
    lists.set(list, [...(lists.get(list) ?? []), t])
  }
  for (const items of lists.values()) {
    const sorted = [...items].sort((a, b) => stepOf(a)! - stepOf(b)!)
    if (sorted.every((t, i) => t === items[i])) continue
    const members = new Set(items.map((t) => t.name))
    let k = 0
    next = next.map((t) => (members.has(t.name) ? sorted[k++] : t))
  }
  return next
}

/** 손으로 차례를 바꾸는 종류에서, 값 하나를 같은 종류 안의 다른 자리로 옮긴다. before의 앞에 놓고, null이면 맨 뒤에 놓는다. */
export function moveInKind(tokens: Token[], kind: Kind, name: string, before: string | null): Token[] {
  const items = tokens.filter((t) => kind.matches(t.name))
  const moving = items.find((t) => t.name === name)
  if (!moving || name === before) return tokens
  const rest = items.filter((t) => t !== moving)
  const at = before === null ? rest.length : rest.findIndex((t) => t.name === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  return place(tokens, (t) => kind.matches(t.name), rest)
}

/** 예외 색(색 목록에 속하지 않은 색)인지. */
const isException = (t: Token) => KINDS.color.matches(t.name) && groupOf(shortName(KINDS.color, t.name)) === ''

/** 예외 색 하나를 예외 색들 안의 다른 자리로 옮긴다. before의 앞에 놓고, null이면 맨 뒤에 놓는다. */
export function moveException(tokens: Token[], name: string, before: string | null): Token[] {
  const items = tokens.filter(isException)
  const moving = items.find((t) => t.name === name)
  if (!moving || name === before) return tokens
  const rest = items.filter((t) => t !== moving)
  const at = before === null ? rest.length : rest.findIndex((t) => t.name === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  return place(tokens, isException, rest)
}

/**
 * 손으로 차례를 바꾸는 종류의 기본 순서. "원래대로"가 돌아가는 곳이다.
 * 그림자는 멀리 지는 정도(가장 넓게 퍼지는 겹의 흐림)가 작은 것부터, 투명도와 흐림은 값이 작은 것부터, 비율은 세로로 긴 것부터 가로로 긴 것으로.
 * 글꼴 종류는 본문 글꼴, 세리프, 고정폭 순서. 흐름은 linear, in, out, in-out 순서. 견줄 수 없는 것은 맨 뒤에 지금 순서 그대로 둔다.
 */
export function defaultFreeOrder(tokens: Token[], kind: Kind): Token[] {
  const has = (t: Token, ...words: string[]) => shortName(kind, t.name).split('-').some((p) => words.includes(p))
  const key = (t: Token): number => {
    switch (kind.id) {
      case 'shadow': {
        const layers = parseShadow(t.value)
        return layers ? Math.max(...layers.map((l) => l.blur + Math.abs(l.y))) : NaN
      }
      case 'aspect': {
        const m = /^(\d*\.?\d+)\s*\/\s*(\d*\.?\d+)$/.exec(t.value.trim())
        return m ? Number(m[1]) / Number(m[2]) : magnitude(t.value)
      }
      case 'font':
        return has(t, 'mono', 'code') || /mono/i.test(t.value) ? 2 : has(t, 'serif') ? 1 : 0
      case 'ease': {
        const short = shortName(kind, t.name)
        const at = ['linear', 'in', 'out', 'in-out'].indexOf(short)
        return at === -1 ? NaN : at
      }
      default:
        return magnitude(t.value)
    }
  }
  const items = tokens.filter((t) => kind.matches(t.name))
  const keys = new Map(items.map((t) => [t, key(t)]))
  const sorted = [...items].sort((a, b) => byNumber(keys.get(a)!, keys.get(b)!))
  return sorted.every((t, i) => t === items[i]) ? tokens : place(tokens, (t) => kind.matches(t.name), sorted)
}
