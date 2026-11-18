// 목록의 줄(또는 칸)을 끌어서 차례를 바꾸는 동작. 손으로 차례를 바꿀 수 있는 종류(효과, 글꼴 종류, 비율, 흐름)의 목록이 함께 쓴다.
// 의미 색과 의미 글꼴 판은 묶음까지 끌 수 있어서 저마다 따로 가지고 있고, 동작은 같다.

import { useRef, useState, type PointerEvent } from 'react'

// 끄는 중에 놓일 자리를 알려 주는 선. 확대 비율과 관계없이 화면에서 같은 굵기로 보인다.
const LINE = 'pointer-events-none absolute z-10 bg-selection'

/**
 * names는 목록에 놓인 차례대로의 값 이름, onMove는 놓았을 때 부르는 것(before 앞에 놓는다. 맨 끝이면 null).
 * onMove를 주지 않으면 끌 수 없는 목록이다(차례가 값의 크기로 저절로 정해지는 종류).
 * attr은 줄(칸)을 찾을 때 쓰는 속성의 이름이다. 값이 아니라 묶음이나 종류를 옮길 때는 그것에 붙인 속성(data-kind 등)을 준다.
 * grid면 여러 칸으로 놓인 목록이라 읽는 순서(왼쪽에서 오른쪽, 위에서 아래)로 자리를 찾고, 선을 칸의 왼쪽·오른쪽에 세로로 긋는다.
 */
export function useReorder(names: string[], onMove: ((name: string, before: string | null) => void) | undefined, grid = false, attr = 'data-token') {
  const drag = useRef<{ name: string; x: number; y: number; moved: boolean } | null>(null)
  // 끌기가 끝난 직후에 따라오는 클릭은 선택으로 치지 않는다.
  const dragged = useRef(false)
  const [drop, setDrop] = useState<{ name: string; before: string | null } | null>(null)

  /** 마우스 자리에서 놓으면 어느 것의 앞에 들어가는지. */
  function slotAt(x: number, y: number): string | null {
    for (const name of names) {
      const box = document.querySelector(`[${attr}="${CSS.escape(name)}"]`)?.getBoundingClientRect()
      if (!box) continue
      const first = grid ? y < box.top || (y <= box.bottom && x < box.left + box.width / 2) : y < box.top + box.height / 2
      if (first) return name
    }
    return null
  }

  /** 줄(칸)의 버튼에 펼쳐 붙인다. 조금이라도 끌어야 옮기기로 치고, 그냥 누르면 선택이다. */
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
            setDrop({ name: d.name, before: slotAt(e.clientX, e.clientY) })
          },
          onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
            const d = drag.current
            drag.current = null
            setDrop(null)
            if (!d?.moved) return
            dragged.current = true
            window.setTimeout(() => (dragged.current = false))
            onMove(d.name, slotAt(e.clientX, e.clientY))
          },
          onPointerCancel: () => {
            drag.current = null
            setDrop(null)
          },
        }
      : {}

  /** 그 줄(칸) 안에 그릴, 놓일 자리의 선. 놓일 자리가 아니면 null. i는 목록에서의 차례. */
  const line = (name: string, i: number) => {
    if (!drop || drop.name === name) return null
    const before = drop.before === name
    const after = drop.before === null && i === names.length - 1
    if (!before && !after) return null
    const place = grid
      ? before
        ? 'inset-y-0 -left-1.5 w-[calc(var(--line)*2)] -translate-x-1/2'
        : 'inset-y-0 -right-1.5 w-[calc(var(--line)*2)] translate-x-1/2'
      : before
        ? 'inset-x-0 top-0 h-[calc(var(--line)*2)] -translate-y-1/2'
        : 'inset-x-0 bottom-0 h-[calc(var(--line)*2)] translate-y-1/2'
    return <span className={`${LINE} ${place}`} />
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
