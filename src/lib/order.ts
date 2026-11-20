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
import { CORNER_REF, KINDS, LENGTH_REF, SPACE_REF, THICKNESS_REF, groupOf, shortName, type Kind } from './catalog'
import { SPACE_USES, readSpaceNote, type SpaceUse } from './spacing'
import { SIZE_GROUPS, readSizeNote, sizeGroupOfToken, sizeKindOf, type SizeGroup } from './sizes'
import { RADIUS_GROUPS, readRadiusNote, type RadiusGroup } from './radius'
import { BORDER_GROUPS, borderGroupOf, type BorderGroup } from './borders'
import { parseShadow } from './effects'
import { hexToLch, toHex } from './color'

/** 값의 크기순으로 저절로 놓이는 종류. */
const SCALE_IDS = ['size', 'weight', 'leading', 'tracking', 'space', 'length', 'corner', 'thickness', 'breakpoint', 'container', 'z']
/** 손으로 차례를 바꿀 수 있는 종류 가운데, 분류 없이 한 목록으로 놓이는 것(의미 색, 의미 글꼴, 색 목록은 저마다의 방식이 따로 있다). */
const FREE_IDS = ['font', 'shadow', 'opacity', 'blur', 'gradient', 'aspect', 'duration', 'ease', 'delay', 'animate', 'spaceuse', 'height', 'width', 'square', 'radius', 'border', 'outline']

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

/**
 * 판에 놓을 종류의 차례. 값이 있는 종류는 파일에 처음 나오는 차례대로 놓는다(끌어서 바꾼 차례가 파일에 남는다).
 * 값이 없는 종류는 파일에 자리가 없으므로 그 뒤에 정해진 차례대로 온다.
 */
export function orderKinds(tokens: Token[], kinds: Kind[]): Kind[] {
  const first = (k: Kind) => tokens.findIndex((t) => k.matches(t.name))
  const filled = kinds.filter((k) => first(k) >= 0).sort((a, b) => first(a) - first(b))
  return [...filled, ...kinds.filter((k) => first(k) < 0)]
}

/** 그 종류의 값과, 값에 딸린 것(이름이 "값의 이름--…"인 것)인지 가리는 함수. */
function ownerOf(tokens: Token[], kind: Kind) {
  const names = tokens.filter((t) => kind.matches(t.name)).map((t) => t.name)
  const set = new Set(names)
  return (t: Token) => set.has(t.name) || names.some((n) => t.name.startsWith(n + '--'))
}

/**
 * 판 안의 종류 하나를 통째로 다른 종류의 앞으로 옮긴다(before가 null이면 그 판의 종류들 맨 뒤로). kinds는 그 판의 종류들이다.
 * 값이 없는 종류는 옮기지 않는다.
 */
export function moveKind(tokens: Token[], kinds: Kind[], kind: Kind, before: Kind | null): Token[] {
  if (kind === before) return tokens
  const mine = ownerOf(tokens, kind)
  const moving = tokens.filter(mine)
  if (moving.length === 0) return tokens
  const rest = tokens.filter((t) => !mine(t))
  let at: number
  if (before) {
    at = rest.findIndex((t) => before.matches(t.name))
    if (at === -1) return tokens
  } else {
    const others = kinds.filter((k) => k !== kind).map((k) => ownerOf(rest, k))
    at = rest.findLastIndex((t) => others.some((own) => own(t))) + 1
    if (at === 0) return tokens
  }
  return [...rest.slice(0, at), ...moving, ...rest.slice(at)]
}

/** 판 안의 종류들을 정해진 차례로 돌려놓는다. 이미 그 차례면 받은 목록을 그대로 돌려준다. */
export function defaultKindOrder(tokens: Token[], kinds: Kind[]): Token[] {
  const now = orderKinds(tokens, kinds).filter((k) => tokens.some((t) => k.matches(t.name)))
  const want = kinds.filter((k) => now.includes(k))
  if (want.every((k, i) => k === now[i])) return tokens
  return want.reduce((list, k) => moveKind(list, kinds, k, null), tokens)
}

/** 의미 간격의 분류들이 판에 놓이는 차례. 파일에 처음 나오는 차례대로다. */
export function spaceUseOrder(tokens: Token[]): SpaceUse[] {
  const kind = KINDS.spaceUse
  return [...new Set(tokens.filter((t) => kind.matches(t.name)).map((t) => readSpaceNote(t.note, shortName(kind, t.name)).use))]
}

/** 의미 간격의 분류 하나를 통째로 다른 분류의 앞으로 옮긴다(before가 null이면 맨 뒤로). 같은 분류의 값들은 파일에서도 한데 모인다. */
export function moveSpaceGroup(tokens: Token[], use: SpaceUse, before: SpaceUse | null): Token[] {
  const kind = KINDS.spaceUse
  const items = tokens.filter((t) => kind.matches(t.name))
  const useOf = (t: Token) => readSpaceNote(t.note, shortName(kind, t.name)).use
  const order = spaceUseOrder(tokens)
  if (!order.includes(use) || use === before) return tokens
  const next = order.filter((u) => u !== use)
  const at = before === null ? next.length : next.indexOf(before)
  next.splice(at === -1 ? next.length : at, 0, use)
  return place(tokens, (t) => kind.matches(t.name), next.flatMap((u) => items.filter((t) => useOf(t) === u)))
}

/**
 * 차례 목록에서 하나를 한 칸 뒤(1)나 앞(-1)으로 옮길 때, 그것이 "누구의 앞"에 놓이는지(맨 끝이면 null).
 * 끌어서 놓을 때와 같은 꼴로 돌려주므로, 단축키도 끌기와 같은 함수로 옮길 수 있다. 더 옮길 곳이 없으면 undefined.
 */
export function stepBefore<T>(order: T[], item: T, dir: 1 | -1): T | null | undefined {
  const i = order.indexOf(item)
  const j = i + dir
  if (i === -1 || j < 0 || j >= order.length) return undefined
  return dir === -1 ? order[j] : (order[j + 1] ?? null)
}

/** 고른 의미 간격을 같은 분류 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. 파일에서 이웃한 다른 분류의 값과는 자리를 바꾸지 않는다. */
export function shiftSpaceUses(tokens: Token[], names: string[], dir: 1 | -1): Token[] {
  const kind = KINDS.spaceUse
  const items = tokens.filter((t) => kind.matches(t.name))
  const useOf = (t: Token) => readSpaceNote(t.note, shortName(kind, t.name)).use
  const groups = spaceUseOrder(tokens).map((u) => items.filter((t) => useOf(t) === u))
  for (const list of groups) {
    const picked = list.map((_, i) => i).filter((i) => names.includes(list[i].name))
    if (dir === 1) picked.reverse()
    for (const i of picked) {
      const j = i + dir
      if (j < 0 || j >= list.length || names.includes(list[j].name)) continue
      ;[list[i], list[j]] = [list[j], list[i]]
    }
  }
  return place(tokens, (t) => kind.matches(t.name), groups.flat())
}

// 한 종류 안을 분류로 나눈 판(의미 모서리, 의미 테두리의 테두리 선과 외곽선)의 순서. 셋이 같은 코드를 쓴다.
// groupOf는 그 종류의 값이면 분류를, 아니면 null을 준다.

/** 한 종류 안에서 분류들이 판에 놓이는 순서. 파일에 처음 나오는 순서대로다. */
function kindGroupOrder<G>(tokens: Token[], groupOf: (t: Token) => G | null): G[] {
  return [...new Set(tokens.map(groupOf).filter((g): g is G => g !== null))]
}

/** 분류 하나를 통째로 다른 분류의 앞으로 옮긴다(before가 null이면 맨 뒤로). 같은 분류의 값들은 파일에서도 한데 모인다. */
function moveKindGroup<G>(tokens: Token[], groupOf: (t: Token) => G | null, group: G, before: G | null): Token[] {
  const isMember = (t: Token) => groupOf(t) !== null
  const items = tokens.filter(isMember)
  const order = kindGroupOrder(tokens, groupOf)
  if (!order.includes(group) || group === before) return tokens
  const next = order.filter((g) => g !== group)
  const at = before === null ? next.length : next.indexOf(before)
  next.splice(at === -1 ? next.length : at, 0, group)
  return place(tokens, isMember, next.flatMap((g) => items.filter((t) => groupOf(t) === g)))
}

/** 고른 값을 같은 분류 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. 파일에서 이웃한 다른 분류의 값과는 자리를 바꾸지 않는다. */
function shiftInKindGroups<G>(tokens: Token[], groupOf: (t: Token) => G | null, names: string[], dir: 1 | -1): Token[] {
  const isMember = (t: Token) => groupOf(t) !== null
  const items = tokens.filter(isMember)
  const groups = kindGroupOrder(tokens, groupOf).map((g) => items.filter((t) => groupOf(t) === g))
  for (const list of groups) {
    const picked = list.map((_, i) => i).filter((i) => names.includes(list[i].name))
    if (dir === 1) picked.reverse()
    for (const i of picked) {
      const j = i + dir
      if (j < 0 || j >= list.length || names.includes(list[j].name)) continue
      ;[list[i], list[j]] = [list[j], list[i]]
    }
  }
  return place(tokens, isMember, groups.flat())
}

const radiusGroupOf = (t: Token) => (KINDS.radius.matches(t.name) ? readRadiusNote(t.note, shortName(KINDS.radius, t.name)).group : null)

/** 의미 모서리의 분류들이 판에 놓이는 순서. */
export const radiusGroupOrder = (tokens: Token[]): RadiusGroup[] => kindGroupOrder(tokens, radiusGroupOf)
/** 의미 모서리의 분류 하나를 통째로 다른 분류의 앞으로 옮긴다. */
export const moveRadiusGroup = (tokens: Token[], group: RadiusGroup, before: RadiusGroup | null) => moveKindGroup(tokens, radiusGroupOf, group, before)
/** 고른 의미 모서리를 같은 분류 안에서 한 칸 옮긴다. */
export const shiftRadii = (tokens: Token[], names: string[], dir: 1 | -1) => shiftInKindGroups(tokens, radiusGroupOf, names, dir)

/** 의미 테두리의 한 종류(테두리 선이나 외곽선) 안에서 분류들이 판에 놓이는 순서. 분류의 순서는 종류마다 따로다. */
export const borderGroupOrder = (tokens: Token[], kind: Kind): BorderGroup[] => kindGroupOrder(tokens, (t) => borderGroupOf(kind, t))
/** 의미 테두리의 한 종류 안에서 분류 하나를 통째로 다른 분류의 앞으로 옮긴다. */
export const moveBorderGroup = (tokens: Token[], kind: Kind, group: BorderGroup, before: BorderGroup | null) => moveKindGroup(tokens, (t) => borderGroupOf(kind, t), group, before)
/** 고른 의미 테두리를 같은 종류의 같은 분류 안에서 한 칸 옮긴다. */
export const shiftBorders = (tokens: Token[], kind: Kind, names: string[], dir: 1 | -1) => shiftInKindGroups(tokens, (t) => borderGroupOf(kind, t), names, dir)

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
      case 'spaceuse': {
        // 의미 간격: 분류의 차례(버튼, 입력칸, 목록, 판, 패널, 창)대로, 분류 안에서는 가리키는 길이가 작은 것부터.
        const use = readSpaceNote(t.note, shortName(kind, t.name)).use
        const ref = SPACE_REF.exec(t.value.trim())?.[1]
        const length = magnitude(tokens.find((x) => x.name === ref)?.value ?? '')
        return SPACE_USES.findIndex((u) => u.id === use) * 100000 + (Number.isNaN(length) ? 99999 : length)
      }
      case 'height':
      case 'width':
      case 'square': {
        // 의미 크기: 분류의 차례대로, 분류 안에서는 가리키는 길이가 작은 것부터(판의 "원래대로"는 defaultSizeOrder가 세 종류를 함께 놓는다).
        const group = readSizeNote(t.note, shortName(kind, t.name)).group
        const ref = LENGTH_REF.exec(t.value.trim())?.[1]
        const length = magnitude(tokens.find((x) => x.name === ref)?.value ?? '')
        return SIZE_GROUPS.findIndex((g) => g.id === group) * 100000 + (Number.isNaN(length) ? 99999 : length)
      }
      case 'border':
      case 'outline': {
        // 의미 테두리: 가리키는 굵기가 가는 것부터. 길이를 직접 적은 값은 그 길이로 견준다.
        const ref = THICKNESS_REF.exec(t.value.trim())?.[1]
        const width = magnitude(ref ? (tokens.find((x) => x.name === ref)?.value ?? '') : t.value)
        return BORDER_GROUPS.findIndex((g) => g.id === borderGroupOf(kind, t)) * 100000 + (Number.isNaN(width) ? 99999 : width)
      }
      case 'radius': {
        // 의미 모서리: 분류의 차례(컨트롤, 컨테이너, 표시)대로, 분류 안에서는 가리키는 둥글기가 작은 것부터. 길이를 직접 적은 값은 그 길이로 견준다.
        const group = readRadiusNote(t.note, shortName(kind, t.name)).group
        const ref = CORNER_REF.exec(t.value.trim())?.[1]
        const length = magnitude(ref ? (tokens.find((x) => x.name === ref)?.value ?? '') : t.value)
        return RADIUS_GROUPS.findIndex((g) => g.id === group) * 100000 + (Number.isNaN(length) ? 99999 : length)
      }
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

/**
 * 색을 색조 순서에 놓는 자리값. 회색 계열(색기가 거의 없는 색)이 맨 앞(-1)이고, 그 뒤로 빨강, 주황, 노랑, 초록, 파랑, 보라, 분홍 순서다.
 * oklch의 색조는 분홍(약 350)과 빨강(약 25)이 0을 사이에 두고 이웃해 있어서, 그 사이(5)에서 끊어 분홍이 맨 뒤로 가게 한다. 어두운 빨강은 색조가 15까지 내려가므로 더 뒤에서 끊으면 빨강이 맨 뒤로 넘어간다.
 */
function hueKey(value: string): number {
  const hex = toHex(value)
  if (!hex) return -1
  const { c, h } = hexToLch(hex.slice(0, 7))
  // hexToLch는 색조를 라디안으로 준다.
  const deg = (((h * 180) / Math.PI) % 360 + 360) % 360
  return c < 0.03 ? -1 : (deg - 5 + 360) % 360
}

/**
 * 새 색 목록이 놓일 자리(tokens에서의 번호). 색 목록은 손으로 순서를 정하는 종류지만, 새로 만들 때는 맨 끝에 붙이지 않고 색조 순서의 제자리에 끼워 넣는다.
 * 지금 있는 목록을 차례로 보다가 새 색보다 색조가 뒤인 첫 목록의 앞에 놓는다. 그런 목록이 없으면 이름 있는 목록들의 맨 뒤(예외 색이 뒤에 있으면 그 앞)다.
 * 목록의 색조는 그 목록에서 색기가 가장 센 색으로 본다(50이나 950은 색기가 약해 색조가 흔들린다). 놓은 뒤에는 다른 목록처럼 손으로 옮길 수 있다.
 */
export function colorListSlot(tokens: Token[], value: string): number {
  const color = KINDS.color
  const lists: { first: number; last: number; key: number; chroma: number }[] = []
  const byName = new Map<string, (typeof lists)[number]>()
  tokens.forEach((t, i) => {
    if (!color.matches(t.name)) return
    const name = groupOf(shortName(color, t.name))
    if (!name) return
    const hex = toHex(t.value)
    const chroma = hex ? hexToLch(hex.slice(0, 7)).c : 0
    const list = byName.get(name)
    if (!list) {
      const made = { first: i, last: i, key: hueKey(t.value), chroma }
      byName.set(name, made)
      lists.push(made)
    } else {
      list.last = i
      if (chroma > list.chroma) {
        list.chroma = chroma
        list.key = hueKey(t.value)
      }
    }
  })
  const key = hueKey(value)
  const next = lists.find((l) => l.key > key)
  if (next) return next.first
  if (lists.length) return Math.max(...lists.map((l) => l.last)) + 1
  // 이름 있는 목록이 아직 없다. 예외 색이 있으면 그 앞, 없으면 맨 끝이다.
  const solo = tokens.findIndex((t) => color.matches(t.name))
  return solo === -1 ? tokens.length : solo
}

/**
 * 아직 판에 없는 분류의 첫 값이 놓일 자리(tokens에서의 번호). 그 분류가 이미 있거나 놓을 제자리가 없으면 -1이다(부르는 쪽이 늘 놓던 자리에 놓는다).
 * 분류의 순서는 손으로 정하는 것이지만, 새 분류는 맨 뒤에 붙이지 않고 정해진 분류 순서(order. 추가 창의 분류 목록과 같은 순서)의 제자리에 끼워 넣는다.
 * 판에 놓인 분류를 차례로 보다가 정해진 순서에서 새 분류보다 뒤인 첫 분류의 앞에 놓는다. 판의 분류 순서는 파일에 처음 나오는 순서이므로 그 분류의 첫 값 앞이 그 자리다.
 * groupOf는 그 종류의 값이면 분류를, 아니면 null을 준다. 놓은 뒤에는 다른 분류처럼 손으로 옮길 수 있다.
 */
export function newGroupSlot<G>(tokens: Token[], groupOf: (t: Token) => G | null, group: G, order: readonly G[]): number {
  const rank = order.indexOf(group)
  const seen = new Set<G>()
  let at = -1
  for (let i = 0; i < tokens.length; i++) {
    const g = groupOf(tokens[i])
    if (g === null) continue
    if (g === group) return -1
    if (at === -1 && rank >= 0 && !seen.has(g) && order.indexOf(g) > rank) at = i
    seen.add(g)
  }
  return at
}

const SIZE_KINDS = [KINDS.height, KINDS.width, KINDS.square]
const isSize = (t: Token) => sizeKindOf(t) !== undefined

/**
 * 의미 크기 판에 분류가 놓이는 순서. 파일에 처음 나오는 순서대로다.
 * 판은 높이·너비·정사각형을 가르지 않는다. 세 종류의 값이 파일에서 한 줄로 이어져 있고, 그 순서가 곧 판의 순서다(의미 간격과 같다).
 * 종류마다 순서를 따로 두면, 한 종류에만 있는 분류(정사각형뿐인 "버튼")를 다른 종류에만 있는 분류 앞으로 옮길 수 없다.
 */
export function sizeBoardGroupOrder(tokens: Token[]): SizeGroup[] {
  return [...new Set(tokens.filter(isSize).map((t) => sizeGroupOfToken(t)!))]
}

/** 의미 크기 판에서 분류 하나를 통째로 다른 분류의 앞으로 옮긴다(before가 null이면 맨 뒤로). 그 분류의 값들이 파일에서 한데 모여 옮겨진다. */
export function moveSizeBoardGroup(tokens: Token[], group: SizeGroup, before: SizeGroup | null): Token[] {
  const order = sizeBoardGroupOrder(tokens)
  if (!order.includes(group) || group === before) return tokens
  const next = order.filter((g) => g !== group)
  const at = before === null ? next.length : next.indexOf(before)
  next.splice(at === -1 ? next.length : at, 0, group)
  const items = tokens.filter(isSize)
  const sorted = next.flatMap((g) => items.filter((t) => sizeGroupOfToken(t) === g))
  return sorted.every((t, i) => t === items[i]) ? tokens : place(tokens, isSize, sorted)
}

/** 같은 분류의 의미 크기들(높이, 너비, 정사각형을 가리지 않는다). 판에서 한 분류 아래에 놓이는 줄들이다. */
function sizePeers(tokens: Token[], name: string): Token[] {
  const me = tokens.find((t) => t.name === name)
  const group = me ? sizeGroupOfToken(me) : null
  return group === null ? [] : tokens.filter((t) => sizeGroupOfToken(t) === group)
}

/**
 * 의미 크기 하나를 같은 분류의 값들 사이에서 before 앞으로 옮긴다(null이면 그 값들의 맨 뒤).
 * 그 값들이 파일에서 차지하던 자리들 안에서만 다시 놓는다. 사이에 끼어 있던 다른 분류의 값은 제자리에 있다.
 */
export function moveSizeInGroup(tokens: Token[], name: string, before: string | null): Token[] {
  const peers = sizePeers(tokens, name)
  const me = peers.find((t) => t.name === name)
  if (!me || peers.length < 2 || name === before) return tokens
  const next = peers.filter((t) => t !== me)
  const at = before === null ? next.length : next.findIndex((t) => t.name === before)
  if (at === -1) return tokens
  next.splice(at, 0, me)
  if (next.every((t, i) => t === peers[i])) return tokens
  const slots = new Set(peers)
  let k = 0
  return tokens.map((t) => (slots.has(t) ? next[k++] : t))
}

/** 의미 크기 하나를 같은 분류의 값들 사이에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. 끝에 있으면 그대로다. */
export function shiftSizeInGroup(tokens: Token[], name: string, dir: 1 | -1): Token[] {
  const peers = sizePeers(tokens, name)
  const at = peers.findIndex((t) => t.name === name)
  const to = at + dir
  if (at === -1 || to < 0 || to >= peers.length) return tokens
  return moveSizeInGroup(tokens, name, dir === 1 ? (peers[to + 1]?.name ?? null) : peers[to].name)
}

/**
 * 의미 크기 판의 "원래대로"가 돌려놓는 순서. 분류는 정해진 순서(추가 창의 분류 목록)대로,
 * 분류 안에서는 높이, 너비, 정사각형의 순서로, 그 안에서는 가리키는 길이가 작은 것부터 놓는다(길이가 같으면 지금 순서 그대로).
 * 이미 그 순서면 받은 배열을 그대로 돌려준다.
 */
export function defaultSizeOrder(tokens: Token[]): Token[] {
  const items = tokens.filter(isSize)
  const key = (t: Token) => {
    const ref = LENGTH_REF.exec(t.value.trim())?.[1]
    const length = magnitude(tokens.find((x) => x.name === ref)?.value ?? '')
    return [SIZE_GROUPS.findIndex((g) => g.id === sizeGroupOfToken(t)), SIZE_KINDS.indexOf(sizeKindOf(t)!), Number.isNaN(length) ? Infinity : length]
  }
  const keys = new Map(items.map((t) => [t, key(t)]))
  const sorted = [...items].sort((a, b) => {
    const x = keys.get(a)!
    const y = keys.get(b)!
    return x[0] - y[0] || x[1] - y[1] || (x[2] === y[2] ? 0 : x[2] - y[2])
  })
  return sorted.every((t, i) => t === items[i]) ? tokens : place(tokens, isSize, sorted)
}
