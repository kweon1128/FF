// 끌어서 차례를 바꾸는 동작. 판에서 끌 수 있는 것은 모두 이것 하나로 끈다:
// 값의 줄과 칸(효과, 글꼴 종류, 의미 색, 의미 글꼴, 의미 간격, 예외 색), 그리고 묶음(색 목록, 의미 판의 묶음, 판 안의 종류).
// 끄는 법이 한 곳에 있어야 어느 판에서나 똑같이 움직인다(얼마나 끌어야 옮기기로 치는지, 놓일 자리를 어떻게 찾는지, 선을 어디에 긋는지).

import { useRef, useState, type PointerEvent } from 'react'

// 끄는 중에 놓일 자리를 알려 주는 선. 확대 비율과 관계없이 화면에서 같은 굵기로 보인다.
const LINE = 'pointer-events-none absolute z-mark bg-selection'

// 선은 이웃한 둘 사이의 한가운데에 긋는다. 그래서 둘 사이의 틈(px)의 절반만큼 바깥으로 내민다.
// 내미는 거리는 따로 적어 두지 않고 틈에서 계산한다. 틈이 바뀌어도 선은 한가운데에 놓인다.

type Options = {
  /** 여러 칸으로 놓인 목록. 읽는 순서(왼쪽에서 오른쪽, 위에서 아래)로 자리를 찾고, 선을 칸의 왼쪽·오른쪽에 세로로 긋는다. */
  grid?: boolean
  /** 끄는 것을 화면에서 찾을 때 쓰는 속성의 이름. 값은 data-token, 묶음은 그 묶음에 붙인 속성(data-kind 등)이다. */
  attr?: string
  /** 이웃한 둘 사이의 틈(px). 줄 사이는 4, 격자의 칸 사이는 12, 묶음 사이는 24(종류 안의 묶음 사이는 16). 주지 않으면 줄은 4, 격자는 12다. */
  gap?: 4 | 12 | 16 | 24
  /** 그 이름이 속한 묶음. 주면 같은 묶음 안에서만 옮겨진다(다른 묶음의 자리는 놓을 곳으로 치지 않는다). */
  scopeOf?: (name: string) => string
}

/**
 * names는 화면에 놓인 차례대로의 이름, onMove는 놓았을 때 부르는 것(before 앞에 놓는다. 맨 끝이면 null).
 * onMove를 주지 않으면 끌 수 없는 목록이다(차례가 값의 크기로 저절로 정해지는 종류).
 */
export function useReorder(names: string[], onMove: ((name: string, before: string | null) => void) | undefined, { grid = false, attr = 'data-token', gap, scopeOf }: Options = {}) {
  const drag = useRef<{ name: string; x: number; y: number; moved: boolean } | null>(null)
  // 끌기가 끝난 직후에 따라오는 클릭은 선택으로 치지 않는다.
  const dragged = useRef(false)
  const [drop, setDrop] = useState<{ name: string; before: string | null } | null>(null)

  /** 그 이름과 자리를 바꿀 수 있는 것들(같은 묶음의 것들). */
  const peers = (name: string) => (scopeOf ? names.filter((n) => scopeOf(n) === scopeOf(name)) : names)

  /** 마우스 자리에서 놓으면 어느 것의 앞에 들어가는지. */
  function slotAt(name: string, x: number, y: number): string | null {
    for (const peer of peers(name)) {
      const box = document.querySelector(`[${attr}="${CSS.escape(peer)}"]`)?.getBoundingClientRect()
      if (!box) continue
      const first = grid ? y < box.top || (y <= box.bottom && x < box.left + box.width / 2) : y < box.top + box.height / 2
      if (first) return peer
    }
    return null
  }

  /** 잡고 끄는 것(줄, 칸, 묶음 제목)의 버튼에 펼쳐 붙인다. 5px 넘게 끌어야 옮기기로 치고, 그냥 누르면 선택이다. */
  const grab = (name: string) =>
    onMove
      ? {
          onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
            if (e.button !== 0) return
            // 캔버스가 이 끌기를 영역 선택으로 받지 않게 막는다.
            e.stopPropagation()
            // 누르는 순간부터 마우스를 붙잡아 둔다. 빠르게 끌어 밖으로 나가도 계속 따라갈 수 있다.
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { name, x: e.clientX, y: e.clientY, moved: false }
          },
          onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
            const d = drag.current
            if (!d) return
            if (!d.moved) {
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return
              d.moved = true
            }
            setDrop({ name: d.name, before: slotAt(d.name, e.clientX, e.clientY) })
          },
          onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
            const d = drag.current
            drag.current = null
            setDrop(null)
            if (!d?.moved) return
            dragged.current = true
            window.setTimeout(() => (dragged.current = false))
            onMove(d.name, slotAt(d.name, e.clientX, e.clientY))
          },
          onPointerCancel: () => {
            drag.current = null
            setDrop(null)
          },
        }
      : {}

  /** 그 줄(칸, 묶음) 안에 그릴, 놓일 자리의 선. 놓일 자리가 아니면 null. 그 요소는 relative여야 한다. */
  const line = (name: string) => {
    if (!drop || drop.name === name) return null
    const list = peers(drop.name)
    if (!list.includes(name)) return null
    const before = drop.before === name
    const after = drop.before === null && list.at(-1) === name
    if (!before && !after) return null
    const space = gap ?? (grid ? 12 : 4)
    const place = grid
      ? before
        ? 'inset-y-0 w-[calc(var(--line)*2)] -translate-x-1/2'
        : 'inset-y-0 w-[calc(var(--line)*2)] translate-x-1/2'
      : before
        ? 'inset-x-0 h-[calc(var(--line)*2)] -translate-y-1/2'
        : 'inset-x-0 h-[calc(var(--line)*2)] translate-y-1/2'
    const side = grid ? (before ? 'left' : 'right') : before ? 'top' : 'bottom'
    return <span className={`${LINE} ${place}`} style={{ [side]: -space / 2 }} />
  }

  return {
    grab,
    line,
    /** 방금 끌기를 끝냈는지. 참이면 뒤따르는 클릭을 선택으로 치지 않는다. */
    justDragged: () => dragged.current,
    /** 지금 끌고 있는 것인지. 끄는 동안 옅게 보인다. */
    moving: (name: string) => drop?.name === name,
  }
}
