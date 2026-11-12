// 전체 보기: 모든 기본 값을 판으로 펼쳐 놓고 자유롭게 이동하며 보는 넓은 화면.
// 휠은 이동, Ctrl+휠은 확대·축소, 스페이스+끌기는 화면 이동.
// 그냥 끌면 영역 선택(항목은 걸치면, 판은 통째로 들어오면 선택), 판 제목을 끌면 선택한 판들이 함께 이동.
// 끄는 중에 마우스가 화면 가장자리에 닿거나 밖으로 나가면 화면이 그쪽으로 따라 움직인다.
// 판을 끌 때는 다른 판의 가장자리와 가운데, 그리고 옆 판들과 간격이 같아지는 자리에 붙고(Ctrl을 누르면 붙지 않는다), Shift를 누르면 가로나 세로로만 움직인다.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { Lock, Minus, Plus } from 'lucide-react'
import { BOARD_DEFAULTS, type Pos } from './lib/api'
import { arrange, type Arrange, type Placed } from './lib/arrange'
import { HANDLE } from './TokenScreen'

export const BOARD_WIDTH = 560
const BOARD_GAP = 80
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const DRAG_START = 3
/** 메뉴를 눌러 판으로 이동할 때 걸리는 시간. */
const GLIDE_MS = 300
/** 화면 맞춤을 할 때 가장자리에 남기는 여백. */
const FIT_PADDING = 48
/** 끌 때 이 거리(화면 px) 안으로 들어오면 다른 판에 붙는다. */
const SNAP = 6
/** 끄는 중에 마우스가 가장자리에서 이 거리 안으로 오거나 밖으로 나가면 화면이 따라 움직인다. */
const EDGE = 32
/** 따라 움직이는 빠르기. 이 거리만큼 더 나가야 가장 빨라지고, 그 전에는 천천히 움직인다(나간 거리의 제곱에 비례). */
const EDGE_RAMP = 170
const EDGE_MAX = 28
/** 가장자리를 d만큼 넘어섰을 때 한 장면에 움직이는 px. */
const edgeSpeed = (d: number) => Math.max(0.5, EDGE_MAX * Math.min(1, d / EDGE_RAMP) ** 2)

/** 끄는 중에 마지막으로 본 마우스의 자리와 누르고 있던 키. */
type Point = { clientX: number; clientY: number; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }

type Rect = { x: number; y: number; w: number; h: number }
/** 붙었을 때 보이는 안내선, 또는 거리를 재는 선. */
type Guide = { x: number; y: number; len: number; vertical: boolean; label?: string }

const bound = (rects: Rect[]): Rect => {
  const x = Math.min(...rects.map((r) => r.x))
  const y = Math.min(...rects.map((r) => r.y))
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y }
}

/** 한 축에서 움직이는 것의 시작·가운데·끝이 다른 것의 시작·가운데·끝과 가장 가까운 곳을 찾는다. */
function snapAxis(lo: number, size: number, others: [number, number][], tolerance: number) {
  let best: { shift: number; at: number } | null = null
  for (const [start, length] of others)
    for (const target of [start, start + length / 2, start + length])
      for (const mine of [lo, lo + size / 2, lo + size]) {
        const shift = target - mine
        if (Math.abs(shift) <= tolerance && (!best || Math.abs(shift) < Math.abs(best.shift))) best = { shift, at: target }
      }
  return best
}

/** 한 축에서 본 판 하나. lo·size는 그 축, cross는 반대 축에서 차지하는 자리. */
type Span = { lo: number; size: number; cross: number; crossSize: number }

/**
 * 간격 맞춤. 움직이는 것이 양옆 판의 한가운데에 오거나, 옆에 나란히 놓인 두 판의 간격과 같은 간격이 되는 자리를 찾는다.
 * gaps는 같아진 간격들의 [시작, 끝].
 */
function snapGap(me: Span, others: Span[], tolerance: number) {
  // 반대 축에서 겹치는(옆에 나란히 있는) 판만 본다.
  const beside = (a: Span, b: Span) => a.cross < b.cross + b.crossSize && a.cross + a.crossSize > b.cross
  const row = others.filter((o) => beside(o, me))
  const end = (s: Span) => s.lo + s.size
  const lastBefore = (edge: number, list: Span[]) =>
    list.filter((o) => end(o) <= edge + tolerance).sort((a, b) => end(b) - end(a))[0] as Span | undefined
  const firstAfter = (edge: number, list: Span[]) =>
    list.filter((o) => o.lo >= edge - tolerance).sort((a, b) => a.lo - b.lo)[0] as Span | undefined

  const before = lastBefore(me.lo, row)
  const after = firstAfter(end(me), row)
  const options: { at: number; gaps: [number, number][] }[] = []
  if (before && after && after.lo - end(before) >= me.size) {
    const at = (end(before) + after.lo - me.size) / 2
    options.push({ at, gaps: [[end(before), at], [at + me.size, after.lo]] })
  }
  if (before) {
    const prev = lastBefore(before.lo, row.filter((o) => o !== before))
    if (prev && before.lo > end(prev)) {
      const gap = before.lo - end(prev)
      options.push({ at: end(before) + gap, gaps: [[end(prev), before.lo], [end(before), end(before) + gap]] })
    }
  }
  if (after) {
    const next = firstAfter(end(after), row.filter((o) => o !== after))
    if (next && next.lo > end(after)) {
      const gap = next.lo - end(after)
      options.push({ at: after.lo - gap - me.size, gaps: [[after.lo - gap, after.lo], [end(after), next.lo]] })
    }
  }
  const best = options.sort((a, b) => Math.abs(a.at - me.lo) - Math.abs(b.at - me.lo))[0]
  return best && Math.abs(best.at - me.lo) <= tolerance ? { shift: best.at - me.lo, gaps: best.gaps } : null
}

type View = { x: number; y: number; z: number }
type Board = { id: string; title: string; content: ReactNode }
/** 캔버스에 붙인 사진. 판처럼 선택하고 옮기며, 꼭짓점을 끌어 크기를 바꾼다. */
type Picture = { id: string; src: string; x: number; y: number; w: number; h: number }
const CORNERS = ['nw', 'ne', 'sw', 'se'] as const
const MIN_PICTURE = 16
type Box = { left: number; top: number; right: number; bottom: number }

type Drag =
  | { type: 'pan'; startX: number; startY: number; view: View; moved: boolean }
  | {
      type: 'board'
      startX: number
      startY: number
      start: Record<string, Pos>
      next?: Record<string, Pos>
      /** 움직이는 판들을 감싼 상자와, 붙을 수 있는 나머지 판들. */
      box: Rect | null
      others: Rect[]
      moved: boolean
    }
  | {
      type: 'resize'
      startX: number
      startY: number
      id: string
      corner: (typeof CORNERS)[number]
      from: Rect
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

/** 비어 있는(undefined) 값을 뺀다. 기본값 위에 덮어쓸 때 빈 값이 기본값을 지우지 않게 한다. */
const definedOnly = <T extends object>(o: T | undefined) =>
  Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => v !== undefined)) as Partial<T>

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
  images,
  positions,
  selectedItems,
  onSelectItems,
  selectedBoards,
  onSelectBoards: setSelectedBoards,
  onMove,
  focus,
}: {
  viewKey: string
  boards: Board[]
  images: Picture[]
  positions: Record<string, Pos>
  /** 선택한 항목(기본 값)의 이름들. 항목은 data-token 속성으로 찾는다. */
  selectedItems: string[]
  onSelectItems: (names: string[]) => void
  selectedBoards: string[]
  onSelectBoards: (ids: string[]) => void
  /** 화면에 맞춰 보여 줄 판. id가 없으면 전체. nonce가 바뀔 때마다 그곳으로 이동한다. */
  focus: { id: string | null; token?: string | null; nonce: number }
  /** 움직이거나 고친 판들의 새 값. 적지 않은 값은 그대로 둔다. */
  onMove: (moved: Record<string, Partial<Pos>>) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const justDragged = useRef(false)
  const [view, setView] = useState<View>(() => loadView(viewKey))
  const [live, setLive] = useState<Record<string, Pos> | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [space, setSpace] = useState(false)
  const [panning, setPanning] = useState(false)
  const [guides, setGuides] = useState<Guide[]>([])
  // 끌기를 시작했을 때의 보기 위치와, 끄는 중의 마지막 마우스 자리. 끄는 동안 화면이 따라 움직인 만큼을 셈할 때 쓴다.
  const dragView = useRef<View>(view)
  const lastPoint = useRef<Point | null>(null)
  const panLoop = useRef(0)
  // Alt를 누르고 있는 동안 선택한 판과 마우스를 올린 판 사이의 거리를 보여 준다.
  const [alt, setAlt] = useState(false)
  const [over, setOver] = useState<string | null>(null)

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
      if (e.key === 'Alt') return setAlt(true)
      if (e.code !== 'Space' || typing(e.target)) return
      e.preventDefault()
      setSpace(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        // Alt만 눌렀다 떼면 브라우저 메뉴로 초점이 넘어가므로 막는다.
        e.preventDefault()
        return setAlt(false)
      }
      if (e.code !== 'Space') return
      if (!typing(e.target)) e.preventDefault()
      setSpace(false)
    }
    const blur = () => {
      setSpace(false)
      setAlt(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const pictureOf = (id: string) => images.find((p) => p.id === id)
  const posOf = (id: string, index: number): Pos => {
    const picture = pictureOf(id)
    return { ...(picture ? { x: picture.x, y: picture.y } : (positions[id] ?? defaultPos(index))), ...live?.[id] }
  }
  const widthOf = (id: string) => live?.[id]?.w ?? pictureOf(id)?.w ?? positions[id]?.w ?? BOARD_WIDTH
  /** 캔버스에 놓인 모든 것(판과 사진)의 id. */
  const allIds = [...boards.map((b) => b.id), ...images.map((p) => p.id)]
  const isLocked = (id: string) => !!positions[id]?.locked
  const isHidden = (id: string) => !!positions[id]?.hidden

  /** 판의 흰 면이 캔버스에서 차지하는 자리. 제목은 뺀다. */
  function rectOf(id: string): Rect | null {
    const n = root.current?.querySelector<HTMLElement>(`[data-board="${id}"]`)
    if (!n) return null
    const p = posOf(id, boards.findIndex((b) => b.id === id))
    return { x: p.x, y: p.y + n.offsetTop, w: n.offsetWidth, h: n.offsetHeight }
  }

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

  // 왼쪽 메뉴에서 화면을 고르면 그 판(전체 보기는 모든 판)이 화면에 맞게 보이도록 부드럽게 이동한다.
  const [gliding, setGliding] = useState(false)
  const seenFocus = useRef(focus.nonce)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const opening = seenFocus.current === focus.nonce
    seenFocus.current = focus.nonce
    // 처음 열 때는 지난번에 보던 위치를 그대로 둔다. 다만 특정 판을 고른 채 열렸으면 그 판을 보여 준다.
    if (opening && !focus.id && !focus.token) return
    const targets = [
      ...el.querySelectorAll<HTMLElement>(
        focus.token ? `[data-token="${CSS.escape(focus.token)}"]` : focus.id ? `[data-board="${focus.id}"]` : '[data-board]',
      ),
    ]
    setGliding(!opening)
    fitTo(targets, 1)
    const timer = window.setTimeout(() => setGliding(false), GLIDE_MS + 50)
    return () => window.clearTimeout(timer)
    // 이동은 고른 화면이 바뀔 때만 한다. 보는 위치가 바뀔 때마다 다시 맞추면 안 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.id, focus.token, focus.nonce])

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
      return setSelectedBoards(allIds.filter((id) => !isHidden(id)))
    }

    // 잠그기(Ctrl+Shift+L)와 숨기기(Ctrl+Shift+H)
    if (mod && e.shiftKey && !e.altKey && (e.code === 'KeyL' || e.code === 'KeyH') && selectedBoards.length) {
      done()
      if (e.code === 'KeyH') return onMove(Object.fromEntries(selectedBoards.map((id) => [id, { hidden: true }])))
      const all = selectedBoards.every(isLocked)
      return onMove(Object.fromEntries(selectedBoards.map((id) => [id, { locked: !all }])))
    }

    // 숫자키: 선택한 판의 투명도. 1~9는 10~90%, 0은 100%.
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(e.code)
    if (digit && !mod && !e.altKey && !e.shiftKey && selectedBoards.length && selectedItems.length === 0) {
      done()
      const opacity = digit[1] === '0' ? 100 : Number(digit[1]) * 10
      return onMove(Object.fromEntries(selectedBoards.map((id) => [id, { opacity }])))
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
    // 잠근 판은 움직이지 않는다.
    const picked: Placed[] = selectedBoards.filter((id) => !isLocked(id)).map((id) => {
      const p = posOf(id, boards.findIndex((b) => b.id === id))
      const h = el.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
      return { id, x: p.x, y: p.y, w: widthOf(id), h }
    })
    if (picked.length === 0) return

    // 방향키: 1px씩, Shift를 누르면 10px씩.
    const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code]
    if (arrow && !mod && !e.altKey) {
      done()
      const step = e.shiftKey ? 10 : 1
      return onMove(Object.fromEntries(picked.map((b) => [b.id, { x: b.x + arrow[0] * step, y: b.y + arrow[1] * step }])))
    }

    if (!e.altKey) return
    // Alt+글자는 정렬, Alt+Shift+H/V(피그마의 윈도우 키. Ctrl+Alt도 받는다)는 간격 고르게.
    const spread = e.shiftKey || mod
    const keys: Record<string, Arrange> = spread
      ? { KeyH: 'spreadX', KeyV: 'spreadY' }
      : { KeyA: 'left', KeyD: 'right', KeyH: 'centerX', KeyW: 'top', KeyS: 'bottom', KeyV: 'centerY' }
    const action = keys[e.code]
    if (!action) return
    done()
    const moves = arrange(action, picked)
    if (moves) onMove(moves)
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
    beginDrag(e)
    if (!drag.current) return
    dragView.current = view
    lastPoint.current = null
    followPointer()
  }

  function beginDrag(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    // 판은 제목이나 안쪽 여백을 잡고 옮긴다. 판 안의 항목(버튼)은 잡는 곳이 아니다.
    const grip = target.closest('button, input')
      ? null
      : (target.closest<HTMLElement>('[data-board-handle]')?.dataset.boardHandle ??
        target.closest<HTMLElement>('[data-board]')?.dataset.board)
    const additive = e.shiftKey || e.ctrlKey || e.metaKey

    const knob = e.button === 0 && !space ? target.closest<HTMLElement>('[data-resize]') : null
    const resized = knob ? pictureOf(knob.dataset.resizeId ?? '') : undefined
    if (knob && resized) {
      // 사진의 꼭짓점을 끌면 비율을 지킨 채 크기가 바뀐다.
      drag.current = {
        type: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        id: resized.id,
        corner: knob.dataset.resize as (typeof CORNERS)[number],
        from: { x: resized.x, y: resized.y, w: resized.w, h: resized.h },
        moved: false,
      }
      e.preventDefault()
      return
    }

    if (e.button === 1 || (e.button === 0 && space)) {
      drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view, moved: false }
      setPanning(true)
      e.preventDefault()
      capture(e)
    } else if (e.button === 0 && grip) {
      // 누르면 그 판을 선택하고, 끌면 선택한 판들이 함께 움직인다.
      const id = grip
      const has = selectedBoards.includes(id)
      e.preventDefault()
      if (additive) {
        setSelectedBoards(has ? selectedBoards.filter((b) => b !== id) : [...selectedBoards, id])
        if (has) return
      } else if (!has) {
        setSelectedBoards([id])
        if (selectedItems.length) onSelectItems([])
      }
      // 잠근 판은 선택만 되고 끌리지 않는다.
      if (isLocked(id)) return
      const ids = (has || additive ? union(selectedBoards, [id]) : [id]).filter((b) => !isLocked(b))
      const start = Object.fromEntries(ids.map((b) => [b, posOf(b, boards.findIndex((x) => x.id === b))]))
      const rects = (list: string[]) => list.map(rectOf).filter((r): r is Rect => r !== null)
      const moving = rects(ids)
      // 움직이기 전에는 포인터를 붙잡지 않는다. 붙잡으면 클릭이 바탕을 누른 것으로 처리되어 선택이 풀린다.
      drag.current = {
        type: 'board',
        startX: e.clientX,
        startY: e.clientY,
        start,
        box: moving.length ? bound(moving) : null,
        others: rects(allIds.filter((b) => !ids.includes(b))),
        moved: false,
      }
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
    lastPoint.current = { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey }
    applyDrag(lastPoint.current, () => capture(e))
  }

  /** 끄는 동안 마우스가 가장자리 가까이 가거나 밖으로 나가면, 그쪽으로 화면을 계속 옮긴다. */
  function followPointer() {
    cancelAnimationFrame(panLoop.current)
    const tick = () => {
      const d = drag.current
      const el = root.current
      if (!d || !el) return
      const p = lastPoint.current
      if (p && d.moved && d.type !== 'pan') {
        const r = el.getBoundingClientRect()
        const push = (at: number, lo: number, hi: number) =>
          at < lo + EDGE ? edgeSpeed(lo + EDGE - at) : at > hi - EDGE ? -edgeSpeed(at - (hi - EDGE)) : 0
        const vx = push(p.clientX, r.left, r.right)
        const vy = push(p.clientY, r.top, r.bottom)
        if (vx || vy) setView((v) => ({ ...v, x: v.x + vx, y: v.y + vy }))
      }
      panLoop.current = requestAnimationFrame(tick)
    }
    panLoop.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(panLoop.current), [])

  // 끄는 중에 화면이 움직이면, 마우스는 그대로여도 끌리는 것의 자리를 다시 셈한다.
  useEffect(() => {
    const d = drag.current
    if (d?.moved && d.type !== 'pan' && lastPoint.current) applyDrag(lastPoint.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function applyDrag(e: Point, grab?: () => void) {
    const d = drag.current
    const el = root.current
    if (!d || !el) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > DRAG_START) {
      d.moved = true
      if (d.type !== 'pan') grab?.()
    }
    if (!d.moved) return
    // 끌기를 시작한 뒤로 화면이 따라 움직인 거리. 캔버스에서 보면 그만큼 더 끈 셈이다.
    const px = view.x - dragView.current.x
    const py = view.y - dragView.current.y

    if (d.type === 'pan') {
      setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy })
    } else if (d.type === 'resize') {
      const left = d.corner.endsWith('w')
      const top = d.corner.startsWith('n')
      const w = Math.max(MIN_PICTURE, d.from.w + ((dx - px) / view.z) * (left ? -1 : 1))
      const h = (w * d.from.h) / d.from.w
      // 잡은 꼭짓점의 맞은편 꼭짓점은 제자리에 둔다.
      d.next = { [d.id]: { x: left ? d.from.x + d.from.w - w : d.from.x, y: top ? d.from.y + d.from.h - h : d.from.y, w } }
      setLive(d.next)
    } else if (d.type === 'board') {
      let mx = (dx - px) / view.z
      let my = (dy - py) / view.z
      // Shift를 누르면 더 많이 움직인 쪽으로만 움직인다.
      const free = { x: !e.shiftKey || Math.abs(mx) >= Math.abs(my), y: !e.shiftKey || Math.abs(mx) < Math.abs(my) }
      if (!free.x) mx = 0
      if (!free.y) my = 0
      const lines: Guide[] = []
      // 다른 판의 가장자리나 가운데에 가까워지면 붙이고 그 자리에 선을 긋는다. Ctrl을 누르면 붙지 않는다.
      if (d.box && !e.ctrlKey && !e.metaKey) {
        const tolerance = SNAP / view.z
        const near = (a: number, b: number) => Math.abs(a - b) < 0.5
        let sx = free.x ? snapAxis(d.box.x + mx, d.box.w, d.others.map((o) => [o.x, o.w]), tolerance) : null
        let sy = free.y ? snapAxis(d.box.y + my, d.box.h, d.others.map((o) => [o.y, o.h]), tolerance) : null
        // 양옆 판과 간격이 같아지는 자리에도 붙는다. 가장자리 맞춤과 둘 다 가까우면 더 가까운 쪽을 따른다.
        const spanX = (r: Rect): Span => ({ lo: r.x, size: r.w, cross: r.y, crossSize: r.h })
        const spanY = (r: Rect): Span => ({ lo: r.y, size: r.h, cross: r.x, crossSize: r.w })
        const moved = { ...d.box, x: d.box.x + mx, y: d.box.y + my }
        let gx = free.x ? snapGap(spanX(moved), d.others.map(spanX), tolerance) : null
        let gy = free.y ? snapGap(spanY(moved), d.others.map(spanY), tolerance) : null
        if (gx && sx && Math.abs(sx.shift) < Math.abs(gx.shift)) gx = null
        if (gy && sy && Math.abs(sy.shift) < Math.abs(gy.shift)) gy = null
        if (gx) sx = null
        if (gy) sy = null
        mx += gx?.shift ?? sx?.shift ?? 0
        my += gy?.shift ?? sy?.shift ?? 0
        const now = { ...d.box, x: d.box.x + mx, y: d.box.y + my }
        // 같아진 간격마다 선을 긋고 그 간격을 숫자로 적는다.
        for (const [from, to] of gx?.gaps ?? [])
          lines.push({ x: from, y: now.y + now.h / 2, len: to - from, vertical: false, label: String(Math.round(to - from)) })
        for (const [from, to] of gy?.gaps ?? [])
          lines.push({ x: now.x + now.w / 2, y: from, len: to - from, vertical: true, label: String(Math.round(to - from)) })
        if (sx) {
          const hit = d.others.filter((o) => [o.x, o.x + o.w / 2, o.x + o.w].some((v) => near(v, sx.at)))
          const span = bound([now, ...hit])
          lines.push({ x: sx.at, y: span.y, len: span.h, vertical: true })
        }
        if (sy) {
          const hit = d.others.filter((o) => [o.y, o.y + o.h / 2, o.y + o.h].some((v) => near(v, sy.at)))
          const span = bound([now, ...hit])
          lines.push({ x: span.x, y: sy.at, len: span.w, vertical: false })
        }
      }
      setGuides(lines)
      d.next = Object.fromEntries(Object.entries(d.start).map(([id, p]) => [id, { ...p, x: p.x + mx, y: p.y + my }]))
      setLive(d.next)
    } else {
      const box: Box = {
        // 시작한 자리는 캔버스에 붙어 있으므로 화면이 움직인 만큼 함께 옮긴다.
        left: Math.min(d.startX + px, e.clientX),
        top: Math.min(d.startY + py, e.clientY),
        right: Math.max(d.startX + px, e.clientX),
        bottom: Math.max(d.startY + py, e.clientY),
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
        .filter((id) => !isLocked(id))

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
    cancelAnimationFrame(panLoop.current)
    setPanning(false)
    setMarquee(null)
    setGuides([])
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // 이미 풀려 있으면 그대로 둔다.
    }
    if ((d.type === 'board' || d.type === 'resize') && d.next) onMove(d.next)
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

  // Alt를 누른 채 다른 판에 마우스를 올리면, 선택한 판들과 그 판 사이의 거리를 잰다.
  const measures: Guide[] = []
  if (alt && over && selectedBoards.length > 0 && !selectedBoards.includes(over) && !live) {
    const picked = selectedBoards.map(rectOf).filter((r): r is Rect => r !== null)
    const target = rectOf(over)
    if (picked.length && target) {
      const s = bound(picked)
      const cx = s.x + s.w / 2
      const cy = s.y + s.h / 2
      const gap = (from: number, to: number, vertical: boolean) =>
        measures.push({ x: vertical ? cx : from, y: vertical ? from : cy, len: to - from, vertical, label: String(Math.round(to - from)) })
      if (target.x >= s.x + s.w) gap(s.x + s.w, target.x, false)
      else if (target.x + target.w <= s.x) gap(target.x + target.w, s.x, false)
      if (target.y >= s.y + s.h) gap(s.y + s.h, target.y, true)
      else if (target.y + target.h <= s.y) gap(target.y + target.h, s.y, true)
    }
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
        if (target.closest('[data-canvas-tools]')) return
        const additive = e.shiftKey || e.ctrlKey || e.metaKey
        if (target.closest('button, input')) {
          // 항목을 눌러 고르면 판 선택은 푼다(Shift로 더하는 중이면 그대로 둔다).
          if (!additive && selectedBoards.length) setSelectedBoards([])
          return
        }
        // 판의 제목과 여백은 누르는 순간 이미 선택을 처리했다.
        if (target.closest('[data-board-handle], [data-board]')) return
        // 캔버스 바탕을 누르면 선택을 모두 푼다.
        if (additive) return
        if (selectedItems.length) onSelectItems([])
        if (selectedBoards.length) setSelectedBoards([])
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={
          {
            transition: gliding ? `transform ${GLIDE_MS}ms ease-out` : undefined,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
            // 선과 꼭짓점이 축소해도 화면에서 같은 크기로 보이도록 확대 비율의 반대를 넘긴다.
            '--line': `${1 / view.z}px`,
            '--unzoom': 1 / view.z,
          } as CSSProperties
        }
      >
        {boards.map((board, i) => {
          if (isHidden(board.id)) return null
          const pos = posOf(board.id, i)
          const isSelected = selectedBoards.includes(board.id)
          const look = { ...BOARD_DEFAULTS, ...definedOnly(positions[board.id]) }
          return (
            <div
              key={board.id}
              className="absolute"
              style={{ left: pos.x, top: pos.y, width: widthOf(board.id) }}
              onPointerOver={(e) => {
                setOver(board.id)
                setHovered((e.target as HTMLElement).closest('button, input') ? null : board.id)
              }}
              onPointerLeave={() => {
                setOver(null)
                setHovered(null)
              }}
            >
              <div
                data-board-handle={board.id}
                className={`mb-1.5 inline-flex origin-bottom-left items-center gap-1 align-top [scale:var(--unzoom)] text-xs whitespace-nowrap ${
                  isSelected ? 'font-[550] text-selection' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {board.title}
                {isLocked(board.id) && <Lock size={12} strokeWidth={1.5} aria-label="잠김" />}
              </div>
              {/* 바깥은 선택 표시가 붙는 틀이고, 안쪽이 판의 실제 모양이다. 투명도를 낮춰도 선택 표시는 흐려지지 않는다. */}
              <div
                data-board={board.id}
                className={`line-inset ${hovered === board.id && !marquee ? 'line-2' : isSelected ? 'line-1' : ''}`}
                style={{ '--edge': '0px' } as CSSProperties}
              >
                <div
                  className="border-solid p-6"
                  style={{
                    opacity: look.opacity / 100,
                    borderRadius: look.radius,
                    background: look.fill,
                    borderColor: look.stroke,
                    borderWidth: look.strokeWidth,
                  }}
                >
                  {board.content}
                </div>
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

        {/* 붙여넣은 사진. 판보다 위에 그린다. */}
        {images.map((picture) => {
          const pos = posOf(picture.id, -1)
          const w = widthOf(picture.id)
          const isSelected = selectedBoards.includes(picture.id)
          return (
            <div key={picture.id} className="absolute" style={{ left: pos.x, top: pos.y, width: w, height: (w * picture.h) / picture.w }}>
              <div
                data-board={picture.id}
                className={`line-inset size-full ${hovered === picture.id && !marquee ? 'line-2' : isSelected ? 'line-1' : ''}`}
                style={{ '--edge': '0px' } as CSSProperties}
                onPointerOver={() => {
                  setOver(picture.id)
                  setHovered(picture.id)
                }}
                onPointerLeave={() => {
                  setOver(null)
                  setHovered(null)
                }}
              >
                <img src={picture.src} alt="" draggable={false} className="block size-full" />
                {isSelected &&
                  CORNERS.map((corner) => (
                    <span
                      key={corner}
                      data-resize={corner}
                      data-resize-id={picture.id}
                      className={`${HANDLE} ${corner.startsWith('n') ? '-top-[3px]' : '-bottom-[3px]'} ${corner.endsWith('w') ? '-left-[3px]' : '-right-[3px]'}`}
                      style={{ pointerEvents: 'auto', cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize' }}
                    />
                  ))}
              </div>
            </div>
          )
        })}

        {/* 붙었을 때의 안내선과 거리 재기. 선택과 헷갈리지 않게 밝은 빨강을 쓴다(피그마와 같다). */}
        {[...guides, ...measures].map((g, i) => (
          <div
            key={i}
            className="pointer-events-none absolute z-30 bg-guide"
            style={
              g.vertical
                ? { left: g.x, top: g.y, width: 'var(--line)', height: g.len }
                : { left: g.x, top: g.y, width: g.len, height: 'var(--line)' }
            }
          >
            {g.label && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [scale:var(--unzoom)] rounded-xs bg-guide px-1 text-xs leading-[18px] font-[550] whitespace-nowrap text-white tabular-nums">
                {g.label}
              </span>
            )}
          </div>
        ))}
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
