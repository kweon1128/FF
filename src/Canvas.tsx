// 전체 보기: 모든 기본 값을 판으로 펼쳐 놓고 자유롭게 이동하며 보는 넓은 화면.
// 휠은 이동, Ctrl+휠은 확대·축소, 스페이스+끌기는 화면 이동.
// 그냥 끌면 영역 선택(항목은 걸치면, 판은 통째로 들어오면 선택), 판 제목을 끌면 선택한 판들이 함께 이동.

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Pos } from './lib/api'
import { HANDLE } from './TokenScreen'

export const BOARD_WIDTH = 560
const BOARD_GAP = 80
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const DRAG_START = 3
/** 화면 맞춤을 할 때 가장자리에 남기는 여백. */
const FIT_PADDING = 48

type View = { x: number; y: number; z: number }
type Board = { id: string; title: string; content: ReactNode }
type Box = { left: number; top: number; right: number; bottom: number }

type Drag =
  | { type: 'pan'; startX: number; startY: number; view: View; moved: boolean }
  | {
      type: 'board'
      startX: number
      startY: number
      start: Record<string, Pos>
      next?: Record<string, Pos>
      moved: boolean
    }
  | {
      type: 'marquee'
      startX: number
      startY: number
      /** Shift를 누른 채 시작하면 지금 선택에 더한다. */
      baseItems: string[]
      baseBoards: string[]
      moved: boolean
    }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])
const union = (a: string[], b: string[]) => [...a, ...b.filter((v) => !a.includes(v))]
const touches = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const holds = (outer: Box, inner: Box) =>
  inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom

export function defaultPos(index: number): Pos {
  return { x: index * (BOARD_WIDTH + BOARD_GAP), y: 0 }
}

function loadView(key: string): View {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '')
    if ([v.x, v.y, v.z].every(Number.isFinite)) return { x: v.x, y: v.y, z: clamp(v.z, MIN_ZOOM, MAX_ZOOM) }
  } catch {
    // 저장된 보기 위치가 없으면 기본값을 쓴다.
  }
  return { x: 48, y: 48, z: 1 }
}

export function Canvas({
  viewKey,
  boards,
  positions,
  selectedItems,
  onSelectItems,
  onMove,
}: {
  viewKey: string
  boards: Board[]
  positions: Record<string, Pos>
  /** 선택한 항목(기본 값)의 이름들. 항목은 data-token 속성으로 찾는다. */
  selectedItems: string[]
  onSelectItems: (names: string[]) => void
  /** 움직인 판들의 새 위치. */
  onMove: (moved: Record<string, Pos>) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const justDragged = useRef(false)
  const [view, setView] = useState<View>(() => loadView(viewKey))
  const [live, setLive] = useState<Record<string, Pos> | null>(null)
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [space, setSpace] = useState(false)
  const [panning, setPanning] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(viewKey, JSON.stringify(view))
    } catch {
      // 저장소를 못 쓰면 보기 위치를 기억하지 않는다.
    }
  }, [view, viewKey])

  // 휠: 이동과 확대. 브라우저의 기본 확대를 막아야 하므로 직접 등록한다.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        setView((v) => {
          // 마우스 휠은 한 칸에 100 안팎의 큰 값이, 터치패드 확대는 작은 값이 여러 번 온다.
          // 휠 한 칸에 약 15%씩 바뀌도록 큰 값은 훨씬 약하게 반영한다.
          const strength = Math.abs(e.deltaY) >= 50 ? 0.0015 : 0.008
          const z = clamp(v.z * Math.exp(-e.deltaY * strength), MIN_ZOOM, MAX_ZOOM)
          const k = z / v.z
          return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
        })
      } else {
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
        const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY
        setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 스페이스를 누르고 있는 동안만 끌어서 화면을 이동한다.
  useEffect(() => {
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target)) return
      e.preventDefault()
      setSpace(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (!typing(e.target)) e.preventDefault()
      setSpace(false)
    }
    const blur = () => setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const posOf = (id: string, index: number) => live?.[id] ?? positions[id] ?? defaultPos(index)

  /** 주어진 요소들이 모두 보이도록 화면을 맞춘다. */
  function fitTo(elements: HTMLElement[], maxZoom: number) {
    const el = root.current
    if (!el || elements.length === 0) return
    const origin = el.getBoundingClientRect()
    // 화면에 보이는 위치를 확대·이동 전의 캔버스 좌표로 되돌린다.
    const boxes = elements.map((n) => {
      const r = n.getBoundingClientRect()
      return {
        left: (r.left - origin.left - view.x) / view.z,
        top: (r.top - origin.top - view.y) / view.z,
        right: (r.right - origin.left - view.x) / view.z,
        bottom: (r.bottom - origin.top - view.y) / view.z,
      }
    })
    const left = Math.min(...boxes.map((b) => b.left))
    const top = Math.min(...boxes.map((b) => b.top))
    const width = Math.max(...boxes.map((b) => b.right)) - left
    const height = Math.max(...boxes.map((b) => b.bottom)) - top
    const z = clamp(
      Math.min((el.clientWidth - FIT_PADDING * 2) / width, (el.clientHeight - FIT_PADDING * 2) / height),
      MIN_ZOOM,
      maxZoom,
    )
    setView({ z, x: (el.clientWidth - width * z) / 2 - left * z, y: (el.clientHeight - height * z) / 2 - top * z })
  }

  // 단축키. 키는 피그마와 같다. 최신 상태를 보도록 매번 새 함수를 담아 둔다.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = (e) => {
    const el = root.current
    const t = e.target
    const typing =
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
    if (!el || typing || document.querySelector('[role="dialog"]')) return
    const mod = e.ctrlKey || e.metaKey
    const done = () => e.preventDefault()

    // 선택
    if (e.code === 'Escape') return setSelectedBoards([])
    if (mod && !e.altKey && e.code === 'KeyA') {
      done()
      return setSelectedBoards(boards.map((b) => b.id))
    }

    // 보기
    if (e.shiftKey && !mod && !e.altKey && e.code === 'Digit1') {
      done()
      return fitTo([...el.querySelectorAll<HTMLElement>('[data-board]')], 1)
    }
    if (e.shiftKey && !mod && !e.altKey && e.code === 'Digit2') {
      done()
      const picked = [...el.querySelectorAll<HTMLElement>('[data-board], [data-token]')].filter(
        (n) => selectedBoards.includes(n.dataset.board ?? '') || selectedItems.includes(n.dataset.token ?? ''),
      )
      return fitTo(picked, 2)
    }
    if (mod && e.code === 'Digit0') {
      done()
      return zoomBy(1 / view.z)
    }
    if (!mod && !e.altKey && (e.code === 'Equal' || e.code === 'NumpadAdd')) return zoomBy(1.25)
    if (!mod && !e.altKey && (e.code === 'Minus' || e.code === 'NumpadSubtract')) return zoomBy(1 / 1.25)

    // 여기부터는 선택한 판을 움직이는 단축키.
    const picked = selectedBoards.map((id) => {
      const p = posOf(id, boards.findIndex((b) => b.id === id))
      const h = el.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
      return { id, x: p.x, y: p.y, h }
    })
    if (picked.length === 0) return
    const move = (place: (b: (typeof picked)[number], i: number) => Partial<Pos>) =>
      onMove(Object.fromEntries(picked.map((b, i) => [b.id, { x: b.x, y: b.y, ...place(b, i) }])))

    // 방향키: 1px씩, Shift를 누르면 10px씩.
    const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code]
    if (arrow && !mod && !e.altKey) {
      done()
      const step = e.shiftKey ? 10 : 1
      return move((b) => ({ x: b.x + arrow[0] * step, y: b.y + arrow[1] * step }))
    }

    if (!e.altKey || picked.length < 2) return
    const minX = Math.min(...picked.map((b) => b.x))
    const maxX = Math.max(...picked.map((b) => b.x))
    const top = Math.min(...picked.map((b) => b.y))
    const bottom = Math.max(...picked.map((b) => b.y + b.h))

    if (e.shiftKey || mod) {
      // 간격 맞춤(Alt+Shift+H/V, 피그마의 윈도우 키. Ctrl+Alt도 받는다): 양 끝의 판은 그대로 두고 그 사이를 고르게 나눈다.
      if (picked.length < 3) return
      if (e.code === 'KeyH') {
        done()
        picked.sort((a, b) => a.x - b.x)
        move((_, i) => ({ x: minX + ((maxX - minX) * i) / (picked.length - 1) }))
      } else if (e.code === 'KeyV') {
        done()
        picked.sort((a, b) => a.y - b.y)
        const gap = (bottom - top - picked.reduce((sum, b) => sum + b.h, 0)) / (picked.length - 1)
        let y = top
        move((b) => {
          const here = y
          y += b.h + gap
          return { y: here }
        })
      }
      return
    }

    // 정렬: 판의 너비는 모두 같으므로 가로 방향은 x만 맞추면 된다.
    const align: Record<string, (b: (typeof picked)[number]) => Partial<Pos>> = {
      KeyA: () => ({ x: minX }),
      KeyD: () => ({ x: maxX }),
      KeyH: () => ({ x: (minX + maxX) / 2 }),
      KeyW: () => ({ y: top }),
      KeyS: (b) => ({ y: bottom - b.h }),
      KeyV: (b) => ({ y: (top + bottom) / 2 - b.h / 2 }),
    }
    if (align[e.code]) {
      done()
      move(align[e.code])
    }
  }

  useEffect(() => {
    const listen = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', listen)
    return () => window.removeEventListener('keydown', listen)
  }, [])

  function capture(e: PointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 포인터를 붙잡지 못해도 끌기는 계속된다.
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    const handle = target.closest<HTMLElement>('[data-board-handle]')
    const additive = e.shiftKey || e.ctrlKey || e.metaKey

    if (e.button === 1 || (e.button === 0 && space)) {
      drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view, moved: false }
      setPanning(true)
      e.preventDefault()
      capture(e)
    } else if (e.button === 0 && handle) {
      // 판 제목: 누르면 그 판을 선택하고, 끌면 선택한 판들이 함께 움직인다.
      const id = handle.dataset.boardHandle!
      const has = selectedBoards.includes(id)
      e.preventDefault()
      if (additive) {
        setSelectedBoards(has ? selectedBoards.filter((b) => b !== id) : [...selectedBoards, id])
        if (has) return
      } else if (!has) {
        setSelectedBoards([id])
        if (selectedItems.length) onSelectItems([])
      }
      const ids = has || additive ? union(selectedBoards, [id]) : [id]
      const start = Object.fromEntries(ids.map((b) => [b, posOf(b, boards.findIndex((x) => x.id === b))]))
      // 움직이기 전에는 포인터를 붙잡지 않는다. 붙잡으면 클릭이 바탕을 누른 것으로 처리되어 선택이 풀린다.
      drag.current = { type: 'board', startX: e.clientX, startY: e.clientY, start, moved: false }
    } else if (e.button === 0) {
      // 그 밖의 곳: 끌면 영역 선택. 움직이기 전까지는 보통의 클릭으로 둔다.
      drag.current = {
        type: 'marquee',
        startX: e.clientX,
        startY: e.clientY,
        baseItems: additive ? selectedItems : [],
        baseBoards: additive ? selectedBoards : [],
        moved: false,
      }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const el = root.current
    if (!d || !el) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > DRAG_START) {
      d.moved = true
      if (d.type !== 'pan') capture(e)
    }
    if (!d.moved) return

    if (d.type === 'pan') {
      setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy })
    } else if (d.type === 'board') {
      d.next = Object.fromEntries(
        Object.entries(d.start).map(([id, p]) => [id, { x: p.x + dx / view.z, y: p.y + dy / view.z }]),
      )
      setLive(d.next)
    } else {
      const box: Box = {
        left: Math.min(d.startX, e.clientX),
        top: Math.min(d.startY, e.clientY),
        right: Math.max(d.startX, e.clientX),
        bottom: Math.max(d.startY, e.clientY),
      }
      const origin = el.getBoundingClientRect()
      setMarquee({
        left: box.left - origin.left,
        top: box.top - origin.top,
        right: box.right - origin.left,
        bottom: box.bottom - origin.top,
      })

      // 항목은 영역에 걸치면, 판은 영역 안에 통째로 들어오면 선택한다.
      const items = [...el.querySelectorAll<HTMLElement>('[data-token]')]
        .filter((n) => touches(n.getBoundingClientRect(), box))
        .map((n) => n.dataset.token!)
      const inside = [...el.querySelectorAll<HTMLElement>('[data-board]')]
        .filter((n) => holds(box, n.getBoundingClientRect()))
        .map((n) => n.dataset.board!)

      const nextItems = union(d.baseItems, items)
      const nextBoards = union(d.baseBoards, inside)
      if (!sameList(nextItems, selectedItems)) onSelectItems(nextItems)
      if (!sameList(nextBoards, selectedBoards)) setSelectedBoards(nextBoards)
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    drag.current = null
    setPanning(false)
    setMarquee(null)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // 이미 풀려 있으면 그대로 둔다.
    }
    if (d.type === 'board' && d.next) onMove(d.next)
    setLive(null)
    // 끌기가 끝난 직후에 따라오는 클릭은 선택을 바꾸지 않도록 막는다.
    if (d.moved) {
      justDragged.current = true
      window.setTimeout(() => (justDragged.current = false))
    }
  }

  function zoomBy(factor: number) {
    const el = root.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2
    setView((v) => {
      const z = clamp(v.z * factor, MIN_ZOOM, MAX_ZOOM)
      const k = z / v.z
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
    })
  }

  return (
    <div
      ref={root}
      className={`relative h-full touch-none overflow-hidden bg-workspace select-none ${panning ? 'cursor-grabbing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (!justDragged.current) return
        justDragged.current = false
        e.stopPropagation()
      }}
      onClick={(e) => {
        if (space) return
        const target = e.target as HTMLElement
        if (target.closest('[data-board-handle], [data-canvas-tools]')) return
        const additive = e.shiftKey || e.ctrlKey || e.metaKey
        if (target.closest('button, input')) {
          // 항목을 눌러 고르면 판 선택은 푼다(Shift로 더하는 중이면 그대로 둔다).
          if (!additive && selectedBoards.length) setSelectedBoards([])
          return
        }
        // 판의 여백을 누르면 그 판을 선택한다.
        const boardId = target.closest<HTMLElement>('[data-board]')?.dataset.board
        if (boardId) {
          const has = selectedBoards.includes(boardId)
          if (additive) setSelectedBoards(has ? selectedBoards.filter((b) => b !== boardId) : [...selectedBoards, boardId])
          else {
            setSelectedBoards([boardId])
            if (selectedItems.length) onSelectItems([])
          }
          return
        }
        // 캔버스 바탕을 누르면 선택을 모두 푼다.
        if (additive) return
        if (selectedItems.length) onSelectItems([])
        if (selectedBoards.length) setSelectedBoards([])
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
      >
        {boards.map((board, i) => {
          const pos = posOf(board.id, i)
          const isSelected = selectedBoards.includes(board.id)
          return (
            <div key={board.id} className="absolute" style={{ left: pos.x, top: pos.y, width: BOARD_WIDTH }}>
              <div
                data-board-handle={board.id}
                className={`mb-1.5 inline-block cursor-grab text-xs active:cursor-grabbing ${
                  isSelected ? 'font-[550] text-selection' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {board.title}
              </div>
              <div
                data-board={board.id}
                className={`relative rounded-lg border border-hairline bg-canvas p-6 -outline-offset-1 outline-selection ${
                  isSelected ? 'outline-1' : ''
                }`}
              >
                {board.content}
                {isSelected && (
                  <>
                    <span className={`${HANDLE} -top-[3px] -left-[3px]`} />
                    <span className={`${HANDLE} -top-[3px] -right-[3px]`} />
                    <span className={`${HANDLE} -bottom-[3px] -left-[3px]`} />
                    <span className={`${HANDLE} -right-[3px] -bottom-[3px]`} />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {marquee && (
        <div
          className="pointer-events-none absolute z-20 border border-selection bg-selection/10"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.right - marquee.left,
            height: marquee.bottom - marquee.top,
          }}
        />
      )}

      {space && <div className={`absolute inset-0 z-20 ${panning ? 'cursor-grabbing' : 'cursor-grab'}`} />}

      <div
        data-canvas-tools
        className="absolute right-4 bottom-4 z-30 flex items-center rounded-lg border border-hairline bg-canvas p-1 shadow-float"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="축소"
          onClick={() => zoomBy(1 / 1.25)}
          className="flex size-7 items-center justify-center rounded-md text-ink-soft hover:bg-hover hover:text-ink"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          title="100%로 되돌리기"
          onClick={() => zoomBy(1 / view.z)}
          className="h-7 w-14 rounded-md text-center text-xs tabular-nums hover:bg-hover"
        >
          {Math.round(view.z * 100)}%
        </button>
        <button
          type="button"
          aria-label="확대"
          onClick={() => zoomBy(1.25)}
          className="flex size-7 items-center justify-center rounded-md text-ink-soft hover:bg-hover hover:text-ink"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
