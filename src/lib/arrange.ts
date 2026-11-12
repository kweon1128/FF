// 전체 보기에서 선택한 판들을 정렬하거나 간격을 맞추는 계산.
// 단축키와 오른쪽 패널의 버튼이 함께 쓴다.

/** 판 하나의 자리와 크기. h는 화면에서 잰 높이. */
export type Placed = { id: string; x: number; y: number; w: number; h: number }

export type Arrange = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom' | 'spreadX' | 'spreadY'

type Axis = 'x' | 'y'
type Moves = Record<string, { x: number; y: number }>

const sizeOf = (b: Placed, axis: Axis) => (axis === 'x' ? b.w : b.h)
const sorted = (list: Placed[], axis: Axis) => [...list].sort((a, b) => a[axis] - b[axis])

const place = (list: Placed[], axis: Axis, to: (b: Placed) => number): Moves =>
  Object.fromEntries(list.map((b) => [b.id, { x: b.x, y: b.y, [axis]: to(b) }]))

/** 맨 앞(왼쪽 또는 위)의 판은 그대로 두고, 나머지를 gap만큼 띄워 차례로 놓는다. */
function stack(list: Placed[], axis: Axis, gap: number): Moves {
  const order = sorted(list, axis)
  let at = order[0][axis]
  return place(order, axis, (b) => {
    const here = at
    at += sizeOf(b, axis) + gap
    return here
  })
}

/** 정렬은 판 2개 이상, 간격 고르게는 3개 이상일 때만 된다. 할 수 없으면 null. */
export function arrange(action: Arrange, picked: Placed[]): Moves | null {
  const spread = action === 'spreadX' || action === 'spreadY'
  if (picked.length < (spread ? 3 : 2)) return null

  const axis: Axis = ['left', 'centerX', 'right', 'spreadX'].includes(action) ? 'x' : 'y'
  const start = Math.min(...picked.map((b) => b[axis]))
  const end = Math.max(...picked.map((b) => b[axis] + sizeOf(b, axis)))

  switch (action) {
    case 'left':
    case 'top':
      return place(picked, axis, () => start)
    case 'right':
    case 'bottom':
      return place(picked, axis, (b) => end - sizeOf(b, axis))
    case 'centerX':
    case 'centerY':
      return place(picked, axis, (b) => (start + end) / 2 - sizeOf(b, axis) / 2)
    // 간격 고르게: 양 끝은 그대로 두고 그 사이를 나눈다.
    default: {
      const total = picked.reduce((sum, b) => sum + sizeOf(b, axis), 0)
      return stack(picked, axis, (end - start - total) / (picked.length - 1))
    }
  }
}

/** 판 사이의 간격. 판이 하나뿐이거나 간격이 서로 다르면 null. */
export function gapOf(axis: Axis, picked: Placed[]): number | null {
  if (picked.length < 2) return null
  const order = sorted(picked, axis)
  const gaps = order.slice(1).map((b, i) => b[axis] - order[i][axis] - sizeOf(order[i], axis))
  return gaps.every((g) => Math.abs(g - gaps[0]) < 0.5) ? Math.round(gaps[0]) : null
}

/** 판 사이의 간격을 적은 값으로 맞춘다. */
export function setGap(axis: Axis, gap: number, picked: Placed[]): Moves {
  return stack(picked, axis, gap)
}
