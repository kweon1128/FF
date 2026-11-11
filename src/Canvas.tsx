// 전체 보기: 모든 기본 값을 판으로 펼쳐 놓고 자유롭게 이동하며 보는 넓은 화면.
// 휠은 이동, Ctrl+휠은 확대·축소, 스페이스+끌기나 빈 곳 끌기는 화면 이동, 판 제목 끌기는 판 이동.

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Pos } from './lib/api'

export const BOARD_WIDTH = 560
const BOARD_GAP = 80
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4

type View = { x: number; y: number; z: number }
type Board = { id: string; title: string; content: ReactNode }

type Drag =
  | { type: 'pan'; startX: number; startY: number; view: View; moved: boolean }
  | { type: 'board'; id: string; startX: number; startY: number; pos: Pos; next?: Pos; moved: boolean }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

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
  onMove,
  onDeselect,
}: {
  viewKey: string
  boards: Board[]
  positions: Record<string, Pos>
  onMove: (id: string, pos: Pos) => void
  onDeselect: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const justDragged = useRef(false)
  const [view, setView] = useState<View>(() => loadView(viewKey))
  const [livePos, setLivePos] = useState<{ id: string; pos: Pos } | null>(null)
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

  // 스페이스를 누르고 있는 동안은 어디를 끌어도 화면이 이동한다.
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

  const posOf = (id: string, index: number) =>
    livePos?.id === id ? livePos.pos : (positions[id] ?? defaultPos(index))

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    const handle = target.closest<HTMLElement>('[data-board-handle]')
    const onBackground = target.dataset.canvasBg !== undefined

    if (e.button === 1 || (e.button === 0 && (space || onBackground))) {
      drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view, moved: false }
      setPanning(true)
    } else if (e.button === 0 && handle) {
      const id = handle.dataset.boardHandle!
      const index = boards.findIndex((b) => b.id === id)
      drag.current = { type: 'board', id, startX: e.clientX, startY: e.clientY, pos: posOf(id, index), moved: false }
    } else {
      return
    }
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 포인터를 붙잡지 못해도 끌기는 계속된다.
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.type === 'pan') {
      setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy })
    } else if (d.moved) {
      d.next = { x: d.pos.x + dx / view.z, y: d.pos.y + dy / view.z }
      setLivePos({ id: d.id, pos: d.next })
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    drag.current = null
    setPanning(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // 이미 풀려 있으면 그대로 둔다.
    }
    if (d.type === 'board' && d.next) onMove(d.id, d.next)
    // 끌어서 움직인 직후의 클릭은 선택을 풀지 않도록 표시해 둔다.
    justDragged.current = d.moved
    setLivePos(null)
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
      data-canvas-bg
      className={`relative h-full touch-none overflow-hidden bg-workspace ${panning ? 'cursor-grabbing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        // 항목이나 버튼이 아닌 빈 곳(캔버스 바탕, 판의 여백)을 누르면 선택을 푼다.
        const dragged = justDragged.current
        justDragged.current = false
        if (dragged || space) return
        if (!(e.target as HTMLElement).closest('button, input, [data-board-handle]')) onDeselect()
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
      >
        {boards.map((board, i) => {
          const pos = posOf(board.id, i)
          return (
            <div key={board.id} className="absolute" style={{ left: pos.x, top: pos.y, width: BOARD_WIDTH }}>
              <div
                data-board-handle={board.id}
                className="mb-1.5 inline-block cursor-grab text-xs text-ink-faint select-none hover:text-ink active:cursor-grabbing"
              >
                {board.title}
              </div>
              <div className="rounded-lg border border-hairline bg-canvas p-6">{board.content}</div>
            </div>
          )
        })}
      </div>

      {space && <div data-canvas-bg className={`absolute inset-0 z-20 ${panning ? 'cursor-grabbing' : 'cursor-grab'}`} />}

      <div
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
