import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  ConflictError,
  getCanvas,
  imageUrl,
  getComponents,
  getTokens,
  listSystems,
  putCanvas,
  putComponents,
  putTokens,
  uploadImage,
  type BoardStyle,
  type CanvasImage,
  type Pos,
  type Token,
} from './lib/api'
import {
  ALL_KINDS,
  KINDS,
  PLACEHOLDER_SCREENS,
  SLUG,
  TOKEN_SCREENS,
  TOKEN_SCREEN_IDS,
  groupOf,
  isTokenScreen,
  nextStep,
  shortName,
  type Kind,
  type ScreenId,
  type TokenScreenId,
} from './lib/catalog'
import {
  STATES,
  cloneVariant,
  compCss,
  freshName,
  newComp,
  newSize,
  newVariant,
  normalize,
  renameRef,
  usesOf,
  type Cell,
  type Colors,
  type Comp,
} from './lib/components'
import { isColor, showColor, toHex, toOklch } from './lib/color'
import { SCALE_STEPS, grayOf, makeScale } from './lib/scale'
import { adoptColors, duplicateTokens, kindOf, pasteName, pasteTokens, scanCss, shiftTokens, toCss } from './lib/tokens'
import type { Placed } from './lib/arrange'
import { BatchRename } from './BatchRename'
import { BoardInspector, ImageInspector } from './BoardInspector'
import { Canvas, defaultPos, defaultWidth } from './Canvas'
import { SwatchContext } from './ColorPicker'
import { ComponentInspector } from './ComponentInspector'
import { ComponentScreen } from './ComponentScreen'
import { Inspector, MultiInspector } from './Inspector'
import { Nav } from './Nav'
import { NewGroupForm } from './NewGroup'
import { NewSoloForm } from './NewSolo'
import { NewSystemForm } from './NewSystem'
import { Palette, type PaletteItem } from './Palette'
import { PasteDialog, type PasteJob } from './PasteDialog'
import { Shortcuts } from './Shortcuts'
import { AddColorButtons, KindSections } from './TokenScreen'
import { TopBar, type SaveStatus } from './TopBar'
import { Button, EmptyState, Field, Modal, inputClass } from './ui'

const LAST_SYSTEM_KEY = 'ff.system'
const SAVE_DELAY = 300
const COLOR = KINDS.color

/** 색 값을 파일에 저장하는 형식(oklch)으로 맞춘다. #, rgb, hsl로 적힌 색만 바꾸고, 나머지는 그대로 둔다. */
function storeColors(tokens: Token[]): Token[] {
  let changed = false
  const next = tokens.map((t) => {
    if (!COLOR.matches(t.name) || !isColor(t.value)) return t
    const value = toOklch(t.value)
    if (value === t.value) return t
    changed = true
    return { ...t, value }
  })
  return changed ? next : tokens
}
const NOTICE_MS = 2000

/** 입력칸에 글자를 쓰는 중인지. 쓰는 중에는 단축키가 동작하지 않는다. */
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)

function remember(name: string) {
  try {
    localStorage.setItem(LAST_SYSTEM_KEY, name)
  } catch {
    // 저장소를 못 쓰는 환경에서는 마지막 선택을 기억하지 않는다.
  }
}

function recall() {
  try {
    return localStorage.getItem(LAST_SYSTEM_KEY)
  } catch {
    return null
  }
}

type SaveReport = (result: 'saving' | 'saved' | Error) => void

/** 고칠 때마다 잠깐 기다렸다가 한 번에 파일로 저장한다. */
function useSaver<T>(save: (system: string, data: T) => Promise<unknown>, report: SaveReport) {
  const pending = useRef<{ system: string; data: T; timer: number } | null>(null)
  // 저장은 한 번에 하나씩 차례로 한다. 앞의 저장이 끝나야 파일의 새 지문을 알 수 있어서다.
  const chain = useRef<Promise<void>>(Promise.resolve())

  const flush = useCallback(() => {
    chain.current = chain.current.then(async () => {
      const job = pending.current
      if (!job) return
      pending.current = null
      window.clearTimeout(job.timer)
      try {
        await save(job.system, job.data)
        if (!pending.current) report('saved')
      } catch (e) {
        report(e instanceof Error ? e : new Error())
      }
    })
    return chain.current
  }, [save, report])

  /** 아직 저장하지 않은 변경을 버린다. 밖에서 바뀐 파일을 다시 불러올 때 쓴다. */
  const cancel = useCallback(() => {
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = null
  }, [])

  const queue = useCallback(
    (system: string, data: T) => {
      report('saving')
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = { system, data, timer: window.setTimeout(flush, SAVE_DELAY) }
    },
    [flush, report],
  )

  return { queue, flush, cancel }
}

type CanvasData = { boards: Record<string, Pos>; images: Record<string, CanvasImage>; groups: string[] }

/** 되돌리기를 위해 기억해 두는 한 시점의 내용. */
type Snapshot = {
  tokens: Token[]
  comps: Comp[]
  boards: Record<string, Pos>
  images: Record<string, CanvasImage>
  /** 색을 모두 지워도 남겨 둔 빈 색 목록들. */
  groups: string[]
}

/** 붙여넣은 사진이 이보다 넓으면 이 너비로 줄여서 놓는다. */
const PASTED_IMAGE_WIDTH = 800

const HISTORY_LIMIT = 100
// 이 시간 안에 이어진 변경(글자 입력, 방향키 이동 등)은 한 번의 되돌리기로 묶는다.
const HISTORY_GROUP = 500

type Confirm = { title: string; body: ReactNode; run: () => void }

export function App() {
  const [systems, setSystems] = useState<string[] | null>(null)
  const [system, setSystem] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [comps, setComps] = useState<Comp[]>([])
  const [boards, setBoards] = useState<Record<string, Pos>>({})
  // 캔버스에 붙인 사진들. 선택은 판과 함께 selectedBoards에 담는다.
  const [images, setImages] = useState<Record<string, CanvasImage>>({})
  // 사진을 올리는 동안 바뀐 내용을 놓치지 않도록 가장 최근 것을 따로 들고 있는다.
  // 색을 모두 지워도 사라지지 않게 이름을 따로 기억해 두는 색 목록들.
  const [keptGroups, setKeptGroups] = useState<string[]>([])
  // 선택한 빈 색 목록. 빈 목록은 색이 없어서 목록 이름 자체를 선택하고 Delete로 지운다.
  const [pickedGroup, setPickedGroup] = useState<string | null>(null)
  const latest = useRef({ boards, images })
  latest.current = { boards, images }
  const [file, setFile] = useState('')
  const [compFile, setCompFile] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [screen, setScreen] = useState<ScreenId>('canvas')
  // 선택한 기본 값의 이름들. Shift를 누른 채 누르면 여러 개가 담긴다.
  const [selected, setSelected] = useState<string[]>([])
  // 컴포넌트 화면에서 보고 있는 컴포넌트와 선택한 칸들.
  // 전체 보기에서 선택한 판들.
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [focusNonce, setFocusNonce] = useState(0)
  const [compIndex, setCompIndex] = useState(0)
  const [cells, setCells] = useState<Cell[]>([])
  // 다른 항목을 고를 때만 올린다. 이름을 바꿀 때는 그대로 두어 입력 중인 칸이 유지되게 한다.
  const [selectionId, setSelectionId] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  // 빈 목록에 첫 색을 넣는 중이면 그 목록의 이름. 단계와 색을 묻는 창이 뜬다.
  const [addingFirst, setAddingFirst] = useState<string | null>(null)
  // 단독 색(white, black 등)을 만드는 창이 떠 있는지.
  const [addingSolo, setAddingSolo] = useState(false)
  // 붙여넣기 전에 정할 것이 있을 때(이름이 같은 값, 읽지 못한 값) 띄우는 창의 내용.
  const [pasting, setPasting] = useState<PasteJob | null>(null)
  // FF에서 마지막으로 복사한 글자. 이것을 그대로 붙이는 것은 복제하려는 것이므로 덮어쓸지 묻지 않는다.
  const lastCopied = useRef('')
  const [addingComp, setAddingComp] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  // 빠른 실행에서 값을 고르면 그 값이 화면 가운데에 오게 한다.
  const [focusToken, setFocusToken] = useState<string | null>(null)
  // 이름 바꾸기를 청하면 오른쪽 패널의 그 이름 칸으로 커서를 옮긴다. n은 같은 칸을 다시 청해도 동작하게 한다.
  const [renameAsk, setRenameAsk] = useState<{ what: 'token' | 'variant' | 'size' | 'group'; n: number } | null>(null)
  useEffect(() => {
    if (!renameAsk) return
    const input = document.querySelector<HTMLInputElement>(`aside [data-rename="${renameAsk.what}"]`)
    input?.focus()
    input?.select()
  }, [renameAsk])
  const [palette, setPalette] = useState(false)
  // 여러 값의 이름을 한꺼번에 바꾸는 창.
  const [batch, setBatch] = useState(false)
  const [help, setHelp] = useState(false)
  // 메뉴와 패널을 숨기고 가운데만 보는 상태(Ctrl+\).
  const [bare, setBare] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef(0)
  // 속성 복사(Ctrl+Alt+C)로 담아 둔 것. 값이면 종류와 값, 판이면 모양, 컴포넌트 칸이면 색 세 가지.
  const copied = useRef<
    | { type: 'token'; kind: string; value: string }
    | { type: 'board'; style: BoardStyle }
    | { type: 'cell'; colors: Colors }
    | null
  >(null)

  /** 화면 아래에 잠깐 뜨는 알림. */
  function notify(text: string) {
    setNotice(text)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }

  function copyText(text: string, done: string) {
    navigator.clipboard.writeText(text).then(
      () => notify(done),
      () => {
        // 브라우저가 막으면 예전 방식(보이지 않는 칸을 골라 복사)으로 한 번 더 해 본다.
        const box = document.createElement('textarea')
        box.value = text
        box.style.position = 'fixed'
        box.style.opacity = '0'
        document.body.append(box)
        box.select()
        const ok = document.execCommand('copy')
        box.remove()
        notify(ok ? done : '복사하지 못했어요.')
      },
    )
  }

  // 파일마다 마지막으로 읽거나 쓴 내용의 지문. 저장할 때 함께 보내서, 그 사이에 밖에서 바뀌었으면 덮어쓰지 않게 한다.
  const revs = useRef({ tokens: '', comps: '', canvas: '' })
  // 밖에서 바뀐 파일을 다시 불러오는 함수. 저장이 막혔을 때와 서버가 알려 왔을 때 부른다.
  const reload = useRef<(why: 'blocked' | 'changed') => void>(() => {})

  const report = useCallback<SaveReport>((result) => {
    if (typeof result === 'string') return setStatus(result)
    // 그 사이에 파일이 밖에서 바뀌어 저장이 막혔다. 방금 고친 것은 버리고 파일을 다시 불러온다.
    if (result instanceof ConflictError) return reload.current('blocked')
    setStatus('error')
    setSaveError(result.message || null)
  }, [])

  const saveTokens = useCallback(
    (name: string, data: Token[]) => putTokens(name, data, revs.current.tokens).then((r) => void (revs.current.tokens = r.rev)),
    [],
  )
  const saveComps = useCallback(
    (name: string, data: Comp[]) => putComponents(name, data, revs.current.comps).then((r) => void (revs.current.comps = r.rev)),
    [],
  )
  const saveCanvas = useCallback(
    (name: string, d: CanvasData) =>
      putCanvas(name, d.boards, d.images, d.groups, revs.current.canvas).then((r) => void (revs.current.canvas = r.rev)),
    [],
  )
  const tokenSaver = useSaver<Token[]>(saveTokens, report)
  const compSaver = useSaver<Comp[]>(saveComps, report)
  const canvasSaver = useSaver<CanvasData>(saveCanvas, report)
  const flushTokens = tokenSaver.flush
  const flushComps = compSaver.flush
  const flushCanvas = canvasSaver.flush
  const queueTokens = tokenSaver.queue

  /** 디자인 시스템의 파일 셋을 읽어 화면에 올린다. */
  const load = useCallback(
    async (name: string) => {
      const [data, canvas, components] = await Promise.all([getTokens(name), getCanvas(name), getComponents(name)])
      revs.current = { tokens: data.rev, comps: components.rev, canvas: canvas.rev }
      // 예전에 #으로 저장된 색은 열 때 한 번에 oklch로 바꿔 파일에 다시 쓴다. 화면에 보이는 # 값은 그대로다.
      const stored = storeColors(data.tokens)
      setTokens(stored)
      if (stored !== data.tokens) queueTokens(name, stored)
      setFile(data.file)
      setBoards(canvas.boards)
      setImages(canvas.images ?? {})
      setKeptGroups(canvas.groups ?? [])
      setComps(normalize(components.components))
      setCompFile(components.file)
    },
    [queueTokens],
  )

  const openSystem = useCallback(
    async (name: string) => {
      await Promise.all([flushTokens(), flushComps(), flushCanvas()])
      history.current = { undo: [], redo: [], at: 0 }
      setSystem(name)
      setSelectedBoards([])
      setSelected([])
      setCells([])
      setCompIndex(0)
      setStatus('idle')
      setLoadError(null)
      remember(name)
      try {
        await load(name)
      } catch (e) {
        setTokens([])
        setBoards({})
        setImages({})
        setKeptGroups([])
        setComps([])
        setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.')
      }
    },
    [flushTokens, flushComps, flushCanvas, load],
  )

  useEffect(() => {
    let cancelled = false
    listSystems()
      .then(({ systems }) => {
        if (cancelled) return
        setSystems(systems)
        const last = recall()
        const first = last && systems.includes(last) ? last : systems[0]
        if (first) openSystem(first)
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [openSystem])

  // FF 밖에서(AI나 편집기로) 파일이 바뀌면 다시 불러온다. FF가 들고 있던 예전 내용으로 덮어쓰지 않기 위해서다.
  const systemNow = useRef(system)
  systemNow.current = system
  reload.current = (why) => {
    const name = systemNow.current
    if (!name) return
    // 아직 저장하지 않은 변경과 되돌리기 기록은 예전 내용을 바탕으로 한 것이라 버린다.
    tokenSaver.cancel()
    compSaver.cancel()
    canvasSaver.cancel()
    history.current = { undo: [], redo: [], at: 0 }
    load(name)
      .then(() => {
        setSelectedBoards([])
        setCells([])
        setPickedGroup(null)
        setSelectionId((n) => n + 1)
        setStatus('idle')
        notify(why === 'blocked' ? '파일이 밖에서 바뀌어 있어서 다시 불러왔어요. 방금 고친 것은 반영되지 않았어요.' : '파일이 밖에서 바뀌어 다시 불러왔어요.')
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.'))
  }

  // 서버가 "이 디자인 시스템의 파일이 밖에서 바뀌었다"고 알려 오면 다시 불러온다. 파일 여러 개가 한꺼번에 바뀌어도 한 번만 한다.
  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return
    let timer = 0
    const onChanged = (data: { system: string }) => {
      if (data.system !== systemNow.current) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => reload.current('changed'), 150)
    }
    hot.on('ff:changed', onChanged)
    return () => {
      window.clearTimeout(timer)
      hot.off('ff:changed', onChanged)
    }
  }, [])

  // 되돌리기와 다시 실행. 파일 내용(값, 컴포넌트, 판 위치)이 바뀌기 직전의 모습을 쌓아 둔다.
  const history = useRef<{ undo: Snapshot[]; redo: Snapshot[]; at: number }>({ undo: [], redo: [], at: 0 })

  function record() {
    const h = history.current
    const now = Date.now()
    if (now - h.at > HISTORY_GROUP) {
      h.undo.push({ tokens, comps, boards, images, groups: keptGroups })
      if (h.undo.length > HISTORY_LIMIT) h.undo.shift()
    }
    h.at = now
    h.redo = []
  }

  function saveBoards(next: Record<string, Pos>, nextImages = images, nextGroups = keptGroups) {
    if (!system) return
    setBoards(next)
    setImages(nextImages)
    setKeptGroups(nextGroups)
    canvasSaver.queue(system, { boards: next, images: nextImages, groups: nextGroups })
  }

  /** from에서 하나를 꺼내 그 모습으로 돌아가고, 지금 모습은 to에 쌓는다. */
  function travel(from: Snapshot[], to: Snapshot[]) {
    const snap = from.pop()
    if (!snap || !system) return
    to.push({ tokens, comps, boards, images, groups: keptGroups })
    history.current.at = 0
    if (snap.tokens !== tokens) {
      setTokens(snap.tokens)
      tokenSaver.queue(system, snap.tokens)
    }
    if (snap.comps !== comps) {
      setComps(snap.comps)
      compSaver.queue(system, snap.comps)
    }
    if (snap.boards !== boards || snap.images !== images || snap.groups !== keptGroups) saveBoards(snap.boards, snap.images, snap.groups)
    // 되돌리거나 다시 실행해서 바뀐 것을 선택한다. 무엇이 달라졌는지 바로 보이게 하려는 것이다.
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
    const was = new Map(tokens.map((t) => [t.name, t.value]))
    // 값: 다시 생겼거나(이름이 바뀐 것 포함) 값이 달라진 것.
    const changedTokens = snap.tokens.filter((t) => was.get(t.name) !== t.value).map((t) => t.name)
    // 판과 사진: 자리나 모양이 달라졌거나 다시 생긴 것. 숨긴 판은 뺀다.
    const changedBoards = [
      // 한 번도 옮기지 않았던 판은 기록에 없으므로(기본 자리), 지금 쪽에만 있는 판도 함께 본다.
      ...[...new Set([...Object.keys(snap.boards), ...Object.keys(boards)])].filter(
        (id) => !snap.boards[id]?.hidden && !same(snap.boards[id], boards[id]),
      ),
      ...Object.keys(snap.images).filter((id) => !same(snap.images[id], images[id])),
    ]
    if (changedTokens.length) {
      setSelected(changedTokens)
      setSelectedBoards([])
    } else if (changedBoards.length) {
      setSelected([])
      setSelectedBoards(changedBoards)
    } else {
      // 지워진 것만 있으면(또는 순서만 바뀌었으면) 남아 있는 선택을 그대로 둔다.
      setSelected(selected.filter((name) => snap.tokens.some((t) => t.name === name)))
      setSelectedBoards((ids) => ids.filter((id) => !id.startsWith('img-') || id in snap.images))
    }
    setPickedGroup(null)

    // 컴포넌트: 색이 달라진 칸, 없으면 달라진 크기의 칸을 선택한다.
    const comp = snap.comps[compIndex]
    const now = comps[compIndex]
    const last = cells.at(-1)
    const changedCells: Cell[] = []
    if (comp && now && comp !== now) {
      comp.variants.forEach((variant, v) =>
        STATES.forEach(({ id }) => {
          if (!same(variant.states[id], now.variants[v]?.states[id])) changedCells.push({ v, s: Math.min(last?.s ?? 0, comp.sizes.length - 1), state: id })
        }),
      )
      if (changedCells.length === 0)
        comp.sizes.forEach((size, s) => {
          if (!same(size, now.sizes[s])) changedCells.push({ v: Math.min(last?.v ?? 0, comp.variants.length - 1), s, state: 'default' })
        })
    }
    setCells(
      changedCells.length ? changedCells : comp ? cells.filter((c) => c.v < comp.variants.length && c.s < comp.sizes.length) : [],
    )
    if (!comp) setCompIndex(0)
    setSelectionId((n) => n + 1)
  }

  function commit(next: Token[]) {
    if (!system) return
    record()
    // 어떤 길로 들어온 색이든(새로 만든 기본 색, 스포이드, 붙여넣기) 저장할 때는 oklch로 맞춘다.
    const stored = storeColors(next)
    setTokens(stored)
    tokenSaver.queue(system, stored)
  }

  function commitComps(next: Comp[]) {
    if (!system) return
    record()
    setComps(next)
    compSaver.queue(system, next)
  }

  function select(names: string[]) {
    setSelected(names)
    setPickedGroup(null)
    setSelectionId((n) => n + 1)
  }

  /** additive면 지금 선택에 더하거나(이미 있으면) 뺀다. */
  function pick(name: string, additive: boolean) {
    if (!additive) return select([name])
    select(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name])
  }

  function selectCells(next: Cell[]) {
    setCells(next)
    setSelectionId((n) => n + 1)
  }

  function pickCell(cell: Cell, additive: boolean) {
    if (!additive) return selectCells([cell])
    const same = (c: Cell) => c.v === cell.v && c.s === cell.s && c.state === cell.state
    selectCells(cells.some(same) ? cells.filter((c) => !same(c)) : [...cells, cell])
  }

  function insert(token: Token, after: (t: Token) => boolean) {
    const last = tokens.findLastIndex(after)
    const at = last === -1 ? tokens.length : last + 1
    commit([...tokens.slice(0, at), token, ...tokens.slice(at)])
    select([token.name])
  }

  function addToken(kind: Kind, group?: string) {
    const names = new Set(tokens.map((t) => t.name))

    // 단독 색은 이름을 정해야 하므로 바로 만들지 않고 이름과 색을 묻는다.
    if (kind.id === 'color' && !group) return setAddingSolo(true)

    if (kind.id === 'color' && group) {
      const inGroup = (t: Token) => kind.matches(t.name) && groupOf(shortName(kind, t.name)) === group
      const stepOf = (t: Token) => shortName(kind, t.name).slice(group.length + 1)
      const list = tokens.filter(inGroup)
      const steps = list.map(stepOf)
      // 빈 목록의 첫 색은 바로 만들지 않고, 목록을 만들 때처럼 단계와 색을 묻는다.
      if (list.length === 0) return setAddingFirst(group)
      // 다음 단계: 50~950 중 지금 가장 큰 단계 다음의 빈 단계. 뒤가 다 찼으면 앞쪽의 빈 단계, 빈 목록이면 500.
      const nums = steps.map(Number).filter(Number.isFinite)
      const missing = SCALE_STEPS.filter((s) => !steps.includes(String(s)))
      const next = nums.length === 0 ? (missing.includes(500) ? 500 : missing[0]) : (missing.find((s) => s > Math.max(...nums)) ?? missing[0])
      if (next === undefined) return insert({ name: `${kind.prefix}${group}-${nextStep(steps)}`, value: kind.defaultValue }, inGroup)
      // 색은 아무 색이 아니라 그 단계에 맞게 계산한다. 목록에 있는 색(500이 있으면 500, 없으면 가장 가까운 단계)을 기준으로 삼고,
      // 기준으로 삼을 색이 없으면 그 단계 밝기의 회색을 쓴다.
      // 기준이 될 수 있는 것은 불투명한 색(#rrggbb로 보이는 색)이다.
      const hexOf = (t: Token) => toHex(t.value) ?? ''
      const bases = list.filter((t) => hexOf(t).length === 7 && SCALE_STEPS.includes(Number(stepOf(t))))
      const base =
        bases.find((t) => stepOf(t) === '500') ??
        bases.sort((a, b) => Math.abs(Number(stepOf(a)) - next) - Math.abs(Number(stepOf(b)) - next))[0]
      const value = toOklch(base ? makeScale(hexOf(base), Number(stepOf(base)))[next] : (grayOf(next) ?? kind.defaultValue))
      const added = { name: `${kind.prefix}${group}-${next}`, value }
      // 번호 순서에 맞는 자리에 넣는다. 번호가 아닌 이름은 맨 뒤에 둔다.
      const order = (t: Token) => (Number.isFinite(Number(stepOf(t))) ? Number(stepOf(t)) : Infinity)
      const sorted = [...list, added].sort((a, b) => order(a) - order(b))
      const rest = tokens.filter((t) => !inGroup(t))
      const first = tokens.findIndex(inGroup)
      const at = first === -1 ? rest.findLastIndex((t) => kind.matches(t.name)) + 1 : tokens.slice(0, first).filter((t) => !inGroup(t)).length
      commit([...rest.slice(0, at), ...sorted, ...rest.slice(at)])
      return select([added.name])
    }

    let name = `${kind.prefix}new`
    for (let i = 2; names.has(name); i++) name = `${kind.prefix}new${i}`
    insert({ name, value: kind.defaultValue }, (t) => kind.matches(t.name))
  }

  /** 새 색 목록을 만든다. 첫 색의 단계와 색은 만드는 창에서 정한다. scale이면 그 색을 기준으로 50~950을 모두 만든다. */
  function addGroup(group: string, step: string, value: string, scale = false) {
    setAddingGroup(false)
    if (!scale) return insert({ name: `${COLOR.prefix}${group}-${step}`, value: toOklch(value) }, (t) => COLOR.matches(t.name))
    const colors = makeScale(value, Number(step))
    const made = SCALE_STEPS.map((s) => ({ name: `${COLOR.prefix}${group}-${s}`, value: toOklch(colors[s]) }))
    // 빈 채로 남아 있던 목록에 넣는 경우가 아니면 색들의 맨 뒤에 새 목록으로 놓는다.
    const at = tokens.findLastIndex((t) => COLOR.matches(t.name)) + 1
    commit([...tokens.slice(0, at || tokens.length), ...made, ...tokens.slice(at || tokens.length)])
    select(made.map((t) => t.name))
  }

  function renameToken(from: string, to: string) {
    commit(tokens.map((t) => (t.name === from ? { ...t, name: to } : t)))
    setSelected([to])
    // 이 값을 가리키던 컴포넌트도 새 이름을 따라가게 한다.
    if (JSON.stringify(comps).includes(`"${from}"`)) commitComps(renameRef(comps, from, to))
  }

  /** 여러 값의 이름을 한 번에 바꾼다. 그 값을 가리키던 컴포넌트도 새 이름을 따라간다. */
  function renameMany(renames: Record<string, string>) {
    setBatch(false)
    commit(tokens.map((t) => (renames[t.name] ? { ...t, name: renames[t.name] } : t)))
    // 이름이 서로 맞바뀌어도 꼬이지 않도록 한 번에 훑으며 바꾼다.
    const next: Comp[] = JSON.parse(JSON.stringify(comps), (_, v) => (typeof v === 'string' && renames[v] ? renames[v] : v))
    if (JSON.stringify(next) !== JSON.stringify(comps)) commitComps(normalize(next))
    select(selected.map((name) => renames[name] ?? name))
  }

  /** 색 이름에서 목록과 단계를 읽는다. primary-500처럼 목록에 속하고 단계가 50~950 중 하나일 때만 값이 있다. */
  function scaleOf(name: string) {
    if (!COLOR.matches(name)) return null
    const short = shortName(COLOR, name)
    const group = groupOf(short)
    const step = Number(short.slice(group.length + 1))
    if (!group || !SCALE_STEPS.includes(step)) return null
    const inGroup = (t: Token) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === group
    const have = new Set(tokens.filter(inGroup).map((t) => shortName(COLOR, t.name).slice(group.length + 1)))
    return { group, step, inGroup, missing: SCALE_STEPS.filter((s) => !have.has(String(s))) }
  }

  /**
   * 고른 색을 기준으로 같은 목록에 50~950 단계를 채우고, 목록을 번호 순서로 놓는다.
   * 빈 단계가 있으면 그것만 채우고 이미 있는 단계는 그대로 둔다.
   * 단계가 이미 다 있으면 "다시 생성"이다. 기준 색만 두고 나머지 단계의 색을 모두 새로 계산한 색으로 바꾼다.
   */
  function fillScale(name: string) {
    const scale = scaleOf(name)
    const base = tokens.find((t) => t.name === name)
    const hex = base ? toHex(base.value) : null
    // 기준은 불투명한 색이어야 한다.
    if (!scale || hex?.length !== 7) return
    const colors = makeScale(hex, scale.step)
    const made = scale.missing.map((s) => ({ name: `${COLOR.prefix}${scale.group}-${s}`, value: toOklch(colors[s]) }))
    const again = scale.missing.length === 0
    // 다시 생성할 때 바꿀 값: 기준 색이 아니고 이름이 50~950인 것.
    const renew = (t: Token) => {
      const s = Number(shortName(COLOR, t.name).slice(scale.group.length + 1))
      return again && t.name !== name && SCALE_STEPS.includes(s) ? { ...t, value: toOklch(colors[s]) } : t
    }
    // 번호가 아닌 이름(primary-main 등)은 맨 뒤에 둔다.
    const order = (t: Token) => {
      const n = Number(shortName(COLOR, t.name).slice(scale.group.length + 1))
      return Number.isFinite(n) ? n : Infinity
    }
    const list = [...tokens.filter(scale.inGroup).map(renew), ...made].sort((a, b) => order(a) - order(b))
    const first = tokens.findIndex(scale.inGroup)
    const rest = tokens.filter((t) => !scale.inGroup(t))
    const before = tokens.slice(0, first).filter((t) => !scale.inGroup(t)).length
    commit([...rest.slice(0, before), ...list, ...rest.slice(before)])
    select(list.map((t) => t.name))
  }

  /** 단독 색을 만든다. 다른 단독 색들 뒤에, 없으면 색들의 맨 뒤에 놓는다. */
  function addSolo(name: string, value: string) {
    setAddingSolo(false)
    const solo = (t: Token) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === ''
    insert({ name: COLOR.prefix + name, value }, tokens.some(solo) ? solo : (t) => COLOR.matches(t.name))
  }

  /**
   * 색 목록을 통째로 한 칸 아래(1)나 위(-1)로 옮긴다. 목록의 순서는 파일에 색이 적힌 순서다.
   * 색들을 목록별로 모아 순서를 바꾼 뒤, 원래 색이 있던 자리들에 차례로 다시 채운다.
   */
  function moveGroup(group: string, dir: 1 | -1) {
    const colors = tokens.filter((t) => COLOR.matches(t.name))
    const groupName = (t: Token) => groupOf(shortName(COLOR, t.name))
    const order = [...new Set(colors.map(groupName))]
    const i = order.indexOf(group)
    const j = i + dir
    if (i === -1 || j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    const sorted = order.flatMap((g) => colors.filter((t) => groupName(t) === g))
    let k = 0
    commit(tokens.map((t) => (COLOR.matches(t.name) ? sorted[k++] : t)))
  }

  function removeTokens(names: string[]) {
    const rest = tokens.filter((t) => !names.includes(t.name))
    commit(rest)
    // 목록의 색을 모두 지워도 목록은 빈 채로 남겨 둔다.
    const groupName = (name: string) => (COLOR.matches(name) ? groupOf(shortName(COLOR, name)) : '')
    const emptied = [...new Set(names.map(groupName))].filter(
      (g) => g && !keptGroups.includes(g) && !rest.some((t) => groupName(t.name) === g),
    )
    if (emptied.length) saveBoards(boards, images, [...keptGroups, ...emptied])
    select([])
    setConfirm(null)
  }

  /** 값을 지운다. 컴포넌트가 쓰고 있는 값이 섞여 있을 때만 먼저 묻고, 아니면 바로 지운다(되돌리기로 살릴 수 있다). */
  function askRemoveTokens(names: string[]) {
    const used = names.filter((n) => usesOf(comps, n).length > 0)
    if (used.length === 0) return removeTokens(names)
    const users = [...new Set(used.flatMap((n) => usesOf(comps, n).map((u) => u.name)))]
    const kind = ALL_KINDS.find((k) => k.matches(used[0]))
    setConfirm({
      title: used.length === 1 ? '컴포넌트에서 쓰고 있는 값이에요' : `컴포넌트에서 쓰고 있는 값이 ${used.length}개 있어요`,
      body: (
        <>
          <span className="font-[550] text-ink">{users.join(', ')}</span>에서{' '}
          {used.length === 1 ? (
            <>
              <span className="font-[550] text-ink">{kind ? shortName(kind, used[0]) : used[0]}</span> 값을
            </>
          ) : (
            '이 값들을'
          )}{' '}
          쓰고 있어요. 지우면 그 자리는 비게 돼요.
        </>
      ),
      run: () => removeTokens(names),
    })
  }

  /** 판의 자리나 너비를 바꾼다. 적지 않은 값은 그대로 둔다. */
  function moveBoards(moved: Record<string, Partial<Pos>>) {
    if (!system) return
    record()
    const next = { ...boards }
    const nextImages = { ...images }
    for (const [id, patch] of Object.entries(moved)) {
      const image = images[id]
      if (image) {
        // 사진은 자리와 너비만 바뀐다. 높이는 비율대로 따라온다.
        const w = patch.w ?? image.w
        nextImages[id] = { ...image, x: patch.x ?? image.x, y: patch.y ?? image.y, w, h: (image.h * w) / image.w }
        continue
      }
      next[id] = { ...(boards[id] ?? defaultPos(TOKEN_SCREEN_IDS.indexOf(id as TokenScreenId))), ...patch }
    }
    saveBoards(next, nextImages)
    // 숨긴 판은 선택에서 뺀다.
    const gone = Object.keys(moved).filter((id) => moved[id].hidden && !(id in images))
    if (gone.length) setSelectedBoards((ids) => ids.filter((id) => !gone.includes(id)))
  }

  function changeScreen(id: ScreenId) {
    setScreen(id)
    setFocusToken(null)
    // 숨겨 둔 판의 메뉴를 누르면 다시 보이게 한다.
    if (isTokenScreen(id) && boards[id]?.hidden) moveBoards({ [id]: { hidden: false } })
    // 같은 메뉴를 다시 눌러도 그 판으로 다시 이동하게 한다.
    setFocusNonce((n) => n + 1)
    // 기본 값 메뉴를 누르면 그 판을 선택한다. 오른쪽 패널이 함께 열리므로, 캔버스는 패널을 뺀 나머지의 가운데에 판을 맞춘다.
    setSelectedBoards(isTokenScreen(id) ? [id] : [])
    select([])
    setCells([])
  }

  /** 붙여넣은 사진을 파일로 저장하고, 지금 보고 있는 화면 가운데에 놓는다. */
  async function addImage(file: Blob) {
    if (!system) return
    try {
      const [saved, bitmap] = await Promise.all([uploadImage(system, file), createImageBitmap(file)])
      const scale = Math.min(1, PASTED_IMAGE_WIDTH / bitmap.width)
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      // 캔버스가 기억해 둔 보기 위치로 화면 가운데의 캔버스 좌표를 구한다.
      const main = document.querySelector('main')
      let view = { x: 48, y: 48, z: 1 }
      try {
        view = { ...view, ...JSON.parse(localStorage.getItem(`ff.view.${system}`) ?? '{}') }
      } catch {
        // 기억해 둔 위치가 없으면 기본 위치를 쓴다.
      }
      const cx = ((main?.clientWidth ?? 0) / 2 - view.x) / view.z
      const cy = ((main?.clientHeight ?? 0) / 2 - view.y) / view.z
      const id = `img-${Date.now().toString(36)}`
      record()
      saveBoards(latest.current.boards, {
        ...latest.current.images,
        [id]: { file: saved.file, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h },
      })
      select([])
      setSelectedBoards([id])
    } catch (e) {
      notify(e instanceof Error && e.message ? e.message : '사진을 넣지 못했어요.')
    }
  }

  /** 캔버스에서 사진을 뺀다. 파일은 남겨 두어 되돌리기로 살릴 수 있다. */
  function removeImages(ids: string[]) {
    record()
    saveBoards(boards, Object.fromEntries(Object.entries(images).filter(([id]) => !ids.includes(id))))
    setSelectedBoards((picked) => picked.filter((id) => !ids.includes(id)))
  }

  /** 값 하나를 선택하고 그 값이 화면 가운데에 오게 이동한다. */
  function goToken(name: string) {
    const id = TOKEN_SCREEN_IDS.find((s) => TOKEN_SCREENS[s].kinds.some((k) => k.matches(name)))
    if (!id) return
    if (boards[id]?.hidden) moveBoards({ [id]: { hidden: false } })
    setScreen(id)
    setSelectedBoards([])
    setCells([])
    select([name])
    setFocusToken(name)
    setFocusNonce((n) => n + 1)
  }

  // 컴포넌트
  const comp = comps[compIndex] ?? null

  function openComp(index: number) {
    setScreen('components')
    setCompIndex(index)
    setSelectedBoards([])
    select([])
    setCells([])
  }

  /** 이름 바꾸기(더블클릭, Ctrl+R): 오른쪽 패널의 이름 칸으로 커서를 옮긴다. 패널을 숨겨 두었으면 다시 보인다. */
  function askRename(what: 'token' | 'variant' | 'size' | 'group') {
    setBare(false)
    setRenameAsk((ask) => ({ what, n: (ask?.n ?? 0) + 1 }))
  }

  /** 색 목록의 이름을 통째로 바꾼다. 그 목록의 색이 모두 새 이름을 따라간다. 바꿀 수 없으면 이유를 돌려준다. */
  function renameGroup(from: string, to: string): string | null {
    if (!SLUG.test(to)) return '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
    if (tokens.some((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === to)) return '같은 이름의 목록이 이미 있어요.'
    const head = `${COLOR.prefix}${from}-`
    renameMany(
      Object.fromEntries(
        tokens
          .filter((t) => t.name.startsWith(head) && groupOf(shortName(COLOR, t.name)) === from)
          .map((t) => [t.name, `${COLOR.prefix}${to}-${t.name.slice(head.length)}`]),
      ),
    )
    return null
  }

  function renameTokenInPanel(name: string) {
    if (selected.length !== 1 || selected[0] !== name) select([name])
    askRename('token')
  }

  /** 종류나 크기의 이름을 더블클릭하면 그 종류(크기)의 칸 하나를 선택하고 패널의 이름 칸으로 간다. */
  function renamePartInPanel(part: 'variants' | 'sizes', index: number) {
    const last = cells.at(-1)
    const cell: Cell = part === 'variants' ? { v: index, s: last?.s ?? 0, state: 'default' } : { v: last?.v ?? 0, s: index, state: 'default' }
    if (cells.length !== 1 || (part === 'variants' ? last?.v !== index : last?.s !== index)) selectCells([cell])
    askRename(part === 'variants' ? 'variant' : 'size')
  }

  function duplicateVariant(index: number) {
    if (!comp) return
    const name = freshName(comp.variants.map((v) => v.name), `${comp.variants[index].name}-copy`)
    const variants = [...comp.variants]
    variants.splice(index + 1, 0, cloneVariant(comp.variants[index], name))
    changeComp({ ...comp, variants })
    selectCells([{ v: index + 1, s: cells.at(-1)?.s ?? 0, state: 'default' }])
  }

  function duplicateSize(index: number) {
    if (!comp) return
    const name = freshName(comp.sizes.map((s) => s.name), `${comp.sizes[index].name}-copy`)
    const sizes = [...comp.sizes]
    sizes.splice(index + 1, 0, { ...comp.sizes[index], name })
    changeComp({ ...comp, sizes })
    selectCells([{ v: cells.at(-1)?.v ?? 0, s: index + 1, state: 'default' }])
  }

  /** Ctrl+D: 선택한 값(컴포넌트 화면에서는 선택한 칸의 종류)을 하나 더 만든다. */
  function duplicate() {
    if (screen === 'components') {
      const cell = cells.at(-1)
      if (cell) duplicateVariant(cell.v)
      return
    }
    if (selected.length === 0) return
    // 한 목록을 통째로 골랐으면(색이 둘 이상) 목록을 복제한다. 같은 목록에 copy가 끼어들지 않고 "이름-copy"라는 새 목록이 생긴다.
    if (movableGroup && selected.length > 1) {
      const head = `${COLOR.prefix}${movableGroup}-`
      const list = tokens.filter((t) => t.name.startsWith(head) && groupOf(shortName(COLOR, t.name)) === movableGroup)
      const name = freshName([...colorGroups], `${movableGroup}-copy`)
      const copies = list.map((t) => ({ name: `${COLOR.prefix}${name}-${t.name.slice(head.length)}`, value: t.value }))
      const at = tokens.indexOf(list.at(-1)!) + 1
      commit([...tokens.slice(0, at), ...copies, ...tokens.slice(at)])
      return select(copies.map((t) => t.name))
    }
    const { next, added } = duplicateTokens(tokens, selected)
    commit(next)
    select(added)
  }

  /** Tab: 선택을 다음(1)이나 이전(-1) 항목으로 옮긴다. 옮겼으면 true. */
  function stepSelection(dir: 1 | -1) {
    if (screen === 'components') {
      const last = cells.at(-1)
      if (!comp || !last) return false
      const all = comp.variants.flatMap((_, v) => comp.sizes.flatMap((_, s) => STATES.map(({ id }) => ({ v, s, state: id }))))
      const i = all.findIndex((c) => c.v === last.v && c.s === last.s && c.state === last.state)
      selectCells([all[(i + dir + all.length) % all.length]])
      return true
    }
    const names = [...document.querySelectorAll<HTMLElement>('[data-token]')].map((n) => n.dataset.token!)
    const i = names.indexOf(selected.at(-1) ?? '')
    if (i === -1) return false
    select([names[(i + dir + names.length) % names.length]])
    return true
  }

  /** 스포이드(I): 화면에서 찍은 색을 선택한 색 값에, 색 값이 없으면 선택한 판의 채우기에 넣는다. */
  async function pickColor() {
    const names = selected.filter((n) => COLOR.matches(n))
    if (names.length === 0 && selectedBoards.length === 0) return notify('색 값이나 판을 먼저 선택해 주세요.')
    const Dropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
    if (!Dropper) return notify('이 브라우저에서는 스포이드를 쓸 수 없어요.')
    let hex: string
    try {
      hex = (await new Dropper().open()).sRGBHex.toLowerCase()
    } catch {
      return // Esc로 그만둔 경우
    }
    if (names.length) {
      commit(tokens.map((t) => (names.includes(t.name) ? { ...t, value: toOklch(hex) } : t)))
      setSelectionId((n) => n + 1)
    } else if (/^#[0-9a-f]{6}$/.test(hex)) {
      moveBoards(Object.fromEntries(selectedBoards.map((id) => [id, { fill: hex }])))
    }
  }

  // 복사와 붙여넣기. 클립보드에는 CSS 변수 선언 그대로 담아서, 다른 디자인 시스템이나 코드에도 붙일 수 있다.
  const onClip = useRef<(e: ClipboardEvent) => void>(() => {})
  onClip.current = (e) => {
    if (isTyping(e.target) || document.querySelector('[role="dialog"]') || !system) return
    if (screen !== 'canvas' && !isTokenScreen(screen)) return
    if (e.type === 'copy') {
      const picked = tokens.filter((t) => selected.includes(t.name))
      // 화면의 글자를 긁어서 복사하는 중이면 그대로 둔다.
      if (picked.length === 0 || window.getSelection()?.toString()) return
      lastCopied.current = toCss(picked)
      e.clipboardData?.setData('text/plain', lastCopied.current)
      e.preventDefault()
      return notify(`값 ${picked.length}개를 복사했어요.`)
    }
    // 사진을 붙이면 캔버스에 놓는다.
    const picture = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
    if (picture) {
      e.preventDefault()
      return void addImage(picture)
    }
    const text = e.clipboardData?.getData('text/plain') ?? ''
    const scan = scanCss(text)
    if (scan.tokens.length === 0 && scan.skipped.length === 0) return
    e.preventDefault()
    // 붙여넣은 색은 어떤 형식이든(#, rgb, hsl) oklch로 맞춰 들인다.
    const pasted = storeColors(scan.tokens)
    // 색 값을 선택해 둔 채 붙이면 그 색이 속한 목록으로 들어간다.
    const target = selected.findLast((n) => COLOR.matches(n))
    const into = target ? groupOf(shortName(COLOR, target)) : null
    const adoptable = storeColors(adoptColors(scan.skipped))
    const names = new Set(tokens.map((t) => t.name))
    const conflicts = [...pasted, ...adoptable].filter((t) => names.has(pasteName(t.name, into))).length
    // FF에서 복사한 것을 그대로 붙이는 것은 복제다. 그 밖에 정할 것이 없을 때도 바로 붙인다.
    if (text === lastCopied.current || (conflicts === 0 && scan.skipped.length === 0)) return paste(pasted, into, false)
    setPasting({ pasted, conflicts, skipped: scan.skipped, adoptable, into })
  }

  function paste(pasted: Token[], into: string | null, overwrite: boolean) {
    setPasting(null)
    const { next, added, replaced } = pasteTokens(tokens, pasted, into, overwrite)
    if (added.length === 0) return
    commit(next)
    select(added)
    notify(replaced ? `값 ${added.length}개를 붙여넣었어요. ${replaced}개는 덮어썼어요.` : `값 ${added.length}개를 붙여넣었어요.`)
  }

  useEffect(() => {
    const listen = (e: ClipboardEvent) => onClip.current(e)
    document.addEventListener('copy', listen)
    document.addEventListener('paste', listen)
    return () => {
      document.removeEventListener('copy', listen)
      document.removeEventListener('paste', listen)
    }
  }, [])

  function changeComp(next: Comp) {
    commitComps(comps.map((c, i) => (i === compIndex ? next : c)))
  }

  function addComp(name: string) {
    setAddingComp(false)
    commitComps([...comps, newComp(name)])
    setCompIndex(comps.length)
    selectCells([])
  }

  function addVariant() {
    if (!comp) return
    const name = freshName(comp.variants.map((v) => v.name))
    changeComp({ ...comp, variants: [...comp.variants, newVariant(name)] })
    selectCells([{ v: comp.variants.length, s: 0, state: 'default' }])
  }

  function addSize() {
    if (!comp) return
    const name = freshName(comp.sizes.map((s) => s.name))
    changeComp({ ...comp, sizes: [...comp.sizes, newSize(name)] })
    selectCells([{ v: cells.at(-1)?.v ?? 0, s: comp.sizes.length, state: 'default' }])
  }

  /** 종류, 크기, 컴포넌트는 묻지 않고 바로 지운다(되돌리기로 살릴 수 있다). */
  function removePart(run: () => void) {
    run()
    selectCells([])
  }

  /** 속성 복사(Ctrl+Alt+C): 선택한 것의 속성만 담는다. 값은 값, 판은 모양, 컴포넌트 칸은 색. */
  function copyProps() {
    const cell = cells.at(-1)
    if (screen === 'components') {
      if (!comp || !cell) return
      copied.current = { type: 'cell', colors: { ...comp.variants[cell.v].states[cell.state] } }
    } else if (selected.length) {
      const token = tokens.find((t) => t.name === selected.at(-1))
      const kind = token && kindOf(token.name)
      if (!token || !kind) return
      copied.current = { type: 'token', kind: kind.id, value: token.value }
    } else {
      const id = selectedBoards.find((b) => !(b in images))
      if (!id) return
      const { opacity, radius, fill, stroke, strokeWidth } = boards[id] ?? {}
      copied.current = { type: 'board', style: { opacity, radius, fill, stroke, strokeWidth } }
    }
    notify('속성을 복사했어요.')
  }

  /** 속성 붙여넣기(Ctrl+Alt+V): 담아 둔 속성을 선택한 것들에 입힌다. 이름과 자리는 바뀌지 않는다. */
  function pasteProps() {
    const clip = copied.current
    if (!clip) return
    if (clip.type === 'cell') {
      if (screen !== 'components' || !comp || cells.length === 0) return
      const variants = comp.variants.map((v, i) => {
        const states = { ...v.states }
        for (const c of cells) if (c.v === i) states[c.state] = { ...clip.colors }
        return { ...v, states }
      })
      changeComp({ ...comp, variants })
      return setSelectionId((n) => n + 1)
    }
    if (screen === 'components') return
    if (clip.type === 'token') {
      // 같은 종류의 값에만 입힌다(색은 색에, 간격은 간격에).
      const targets = selected.filter((name) => kindOf(name)?.id === clip.kind)
      if (targets.length === 0) return
      commit(tokens.map((t) => (targets.includes(t.name) ? { ...t, value: clip.value } : t)))
      return setSelectionId((n) => n + 1)
    }
    const targets = selectedBoards.filter((id) => !(id in images))
    if (targets.length) moveBoards(Object.fromEntries(targets.map((id) => [id, clip.style])))
  }

  function toggleBare() {
    if (!bare) notify('Ctrl+\\ 를 누르면 메뉴와 패널이 다시 보여요.')
    setBare(!bare)
  }

  // 단축키: Ctrl+Z 되돌리기, Ctrl+Shift+Z 다시 실행, Delete·Backspace 삭제, Esc 선택 풀기, Ctrl+A 모두 선택. 최신 상태를 보도록 매번 새 함수를 담아 둔다.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = (e) => {
    const mod = e.ctrlKey || e.metaKey
    const dialog = document.querySelector('[role="dialog"]')
    // 글자를 쓰는 중에도 되는 것: 빠른 실행(Ctrl+K), 단축키 목록(Ctrl+Shift+/), 메뉴와 패널 숨기기(Ctrl+\).
    if (mod && !e.altKey && !dialog) {
      const run = (action: () => void) => {
        e.preventDefault()
        action()
      }
      if (!e.shiftKey && (e.code === 'KeyK' || e.code === 'Slash')) return run(() => setPalette(true))
      if (e.shiftKey && e.code === 'Slash') return run(() => setHelp(true))
      if (!e.shiftKey && e.code === 'Backslash') return run(toggleBare)
    }
    // Ctrl+R은 새로 고침으로 쓰지 않는다(실수로 눌러도 화면이 다시 불리지 않게). 하나를 선택했으면 이름 바꾸기다.
    if (mod && !e.altKey && e.code === 'KeyR') {
      e.preventDefault()
      if (e.shiftKey || dialog) return
      if (screen === 'components') {
        if (cells.length) renamePartInPanel('variants', cells.at(-1)!.v)
      } else if (selected.length === 1) renameTokenInPanel(selected[0])
      else if (selected.length > 1) setBatch(true)
      return
    }
    if (isTyping(e.target) || dialog) return

    // Ctrl+Alt+C / V: 속성 복사와 붙여넣기(피그마와 같다).
    if (mod && e.altKey && !e.shiftKey && (e.code === 'KeyC' || e.code === 'KeyV')) {
      e.preventDefault()
      return e.code === 'KeyC' ? copyProps() : pasteProps()
    }

    if (mod && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault()
      const { undo, redo } = history.current
      // Ctrl+Z 되돌리기, Ctrl+Shift+Z(또는 Ctrl+Y) 다시 실행.
      if (e.code === 'KeyY' || e.shiftKey) travel(redo, undo)
      else travel(undo, redo)
    } else if (e.code === 'Escape') {
      if (selected.length || pickedGroup) select([])
      if (cells.length) selectCells([])
    } else if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyD') {
      e.preventDefault()
      duplicate()
    } else if (mod && !e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft')) {
      if (screen === 'components' || selected.length === 0) return
      e.preventDefault()
      const dir = e.code === 'BracketRight' ? 1 : -1
      // 한 색 목록을 통째로 골랐으면 목록을 위아래로 옮기고, 아니면 고른 값을 묶음 안에서 옮긴다.
      if (movableGroup !== null) moveGroup(movableGroup, dir)
      else commit(shiftTokens(tokens, selected, dir))
    } else if (e.code === 'Tab' && !mod && !e.altKey) {
      if (stepSelection(e.shiftKey ? -1 : 1)) e.preventDefault()
    } else if (e.code === 'KeyI' && !mod && !e.altKey && !e.shiftKey) {
      if (screen !== 'components') pickColor()
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
      // 빈 색 목록을 선택했으면 그 목록을 지운다.
      if (pickedGroup && screen !== 'components') {
        e.preventDefault()
        record()
        saveBoards(boards, images, keptGroups.filter((g) => g !== pickedGroup))
        return setPickedGroup(null)
      }
      // 값을 선택하지 않았고 사진을 선택했으면 사진을 지운다(확인 창 없이, 되돌리기로 살릴 수 있다).
      const pictures = selectedBoards.filter((id) => id in images)
      if (screen !== 'components' && selected.length === 0 && pictures.length) {
        e.preventDefault()
        return removeImages(pictures)
      }
      if (screen === 'components' || selected.length === 0) return
      e.preventDefault()
      askRemoveTokens(selected)
    } else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyA') {
      e.preventDefault()
      if (screen === 'canvas') select(tokens.map((t) => t.name))
      else if (isTokenScreen(screen)) {
        const kinds = TOKEN_SCREENS[screen].kinds
        select(tokens.filter((t) => kinds.some((k) => k.matches(t.name))).map((t) => t.name))
      } else if (screen === 'components' && comp) {
        selectCells(
          comp.variants.flatMap((_, v) => comp.sizes.flatMap((_, s) => STATES.map(({ id }) => ({ v, s, state: id })))),
        )
      }
    }
  }

  useEffect(() => {
    const listen = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', listen)
    return () => window.removeEventListener('keydown', listen)
  }, [])

  const sectionProps = {
    tokens,
    selected,
    onSelect: pick,
    onAdd: addToken,
    onAddGroup: () => setAddingGroup(true),
    onAddSolo: () => setAddingSolo(true),
    onRename: renameTokenInPanel,
    emptyGroups: keptGroups,
    pickedGroup,
    onPickGroup: (group: string) => {
      setSelectedBoards([])
      select([])
      setPickedGroup(group)
    },
    onSelectGroup: (names: string[], additive: boolean, rename: boolean) => {
      setSelectedBoards([])
      select(additive ? [...selected, ...names.filter((n) => !selected.includes(n))] : names)
      if (rename) askRename('group')
    },
  }

  const colorGroups = new Set([
    ...tokens.filter((t) => COLOR.matches(t.name)).map((t) => groupOf(shortName(COLOR, t.name))),
    ...keptGroups,
  ])
  const selectedTokens = tokens.filter((t) => selected.includes(t.name))
  const selectedKinds = selectedTokens.map((t) => ALL_KINDS.find((k) => k.matches(t.name)) ?? null)
  const commonKind = selectedKinds.every((k) => k === selectedKinds[0]) ? (selectedKinds[0] ?? null) : null
  const ready = !loadError && systems !== null && system !== null
  // 한 색 목록을 통째로(그리고 그것만) 선택했으면 그 목록의 이름. 오른쪽 패널에서 목록 이름을 고칠 수 있다.
  const groupsPicked = new Set(selectedTokens.map((t) => (COLOR.matches(t.name) ? groupOf(shortName(COLOR, t.name)) : null)))
  const onlyGroup = groupsPicked.size === 1 ? [...groupsPicked][0] : null
  const wholeGroup =
    onlyGroup &&
    selectedTokens.length > 1 &&
    tokens.filter((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === onlyGroup).length === selectedTokens.length
      ? onlyGroup
      : null
  // Ctrl+]/[로 통째로 옮길 수 있는 목록. 한 목록(단독 색 묶음 포함)의 색을 빠짐없이, 그것만 골랐을 때다.
  const movableGroup =
    onlyGroup !== null &&
    selectedTokens.length > 0 &&
    tokens.filter((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === onlyGroup).length === selectedTokens.length
      ? onlyGroup
      : null

  // 선택한 판들의 자리와 크기. 높이는 내용에 따라 정해지므로 화면에서 잰다.
  const pickedBoards: Placed[] =
    screen === 'canvas' || isTokenScreen(screen)
      ? selectedBoards.map((id) => {
          const image = images[id]
          if (image) return { id, x: image.x, y: image.y, w: image.w, h: image.h }
          const pos = boards[id] ?? defaultPos(TOKEN_SCREEN_IDS.indexOf(id as TokenScreenId))
          const h = document.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
          return { id, x: pos.x, y: pos.y, w: pos.w ?? defaultWidth(id), h }
        })
      : []

  // 빠른 실행에 나오는 것들: 화면, 컴포넌트, 값, 명령.
  const paletteItems: PaletteItem[] = !palette
    ? []
    : [
        { id: 's:canvas', group: '화면', label: '전체 보기', run: () => changeScreen('canvas') },
        ...TOKEN_SCREEN_IDS.map((id) => ({ id: `s:${id}`, group: '화면', label: TOKEN_SCREENS[id].title, run: () => changeScreen(id) })),
        ...comps.map((c, i) => ({ id: `c:${i}`, group: '화면', label: c.name, hint: '컴포넌트', run: () => openComp(i) })),
        { id: 'a:help', group: '명령', label: '단축키 목록', hint: 'Ctrl+Shift+/', run: () => setHelp(true) },
        { id: 'a:bare', group: '명령', label: bare ? '메뉴와 패널 보이기' : '메뉴와 패널 숨기기', hint: 'Ctrl+\\', run: toggleBare },
        { id: 'a:group', group: '명령', label: '색 목록 추가', run: () => setAddingGroup(true) },
        { id: 'a:comp', group: '명령', label: '컴포넌트 추가', run: () => setAddingComp(true) },
        { id: 'a:system', group: '명령', label: '새 디자인 시스템', run: () => setCreating(true) },
        ...(systems ?? [])
          .filter((name) => name !== system)
          .map((name) => ({ id: `o:${name}`, group: '명령', label: `${name} 열기`, hint: '디자인 시스템', run: () => void openSystem(name) })),
        ...tokens.map((t) => {
          const kind = kindOf(t.name)
          return {
            id: `t:${t.name}`,
            group: '값',
            label: kind ? `${kind.title} · ${shortName(kind, t.name)}` : t.name,
            hint: COLOR.matches(t.name) ? showColor(t.value) : t.value,
            search: t.name,
            run: () => goToken(t.name),
          }
        }),
      ]

  // 색 선택 창 아래에 견본으로 보여 줄, 이 디자인 시스템의 색들(같은 색은 한 번만).
  const swatches = [
    ...new Set(tokens.filter((t) => COLOR.matches(t.name)).map((t) => toHex(t.value)).filter((hex): hex is string => hex !== null)),
  ]

  return (
    <SwatchContext.Provider value={swatches}>
    <div className="flex h-full flex-col">
      {!bare && <TopBar
        systems={systems ?? []}
        current={system}
        status={status}
        saveError={saveError}
        onSelect={openSystem}
        onNew={() => setCreating(true)}
      />}

      <div className="flex min-h-0 flex-1">
        {!bare && <Nav
          hidden={TOKEN_SCREEN_IDS.filter((id) => boards[id]?.hidden)}
          locked={TOKEN_SCREEN_IDS.filter((id) => boards[id]?.locked)}
          onShow={(id) => moveBoards({ [id]: { hidden: false } })}
          onUnlock={(id) => moveBoards({ [id]: { locked: false } })}
          screen={screen}
          onSelect={changeScreen}
          components={comps.map((c) => c.name)}
          currentComponent={compIndex}
          onPickComponent={(index) => {
            setCompIndex(index)
            selectCells([])
          }}
          onAddComponent={() => setAddingComp(true)}
        />}

        {ready && (screen === 'canvas' || isTokenScreen(screen)) ? (
          <main
            className="min-w-0 flex-1"
            // 빈 목록의 이름이 아닌 곳을 누르면 빈 목록 선택을 푼다.
            onPointerDownCapture={(e) => {
              if (pickedGroup && !(e.target as HTMLElement).closest('[data-group-name]')) setPickedGroup(null)
            }}
          >
            {/* 캔버스는 하나다. 왼쪽 메뉴의 색상·글꼴 등을 누르면 같은 캔버스에서 그 판이 화면에 맞게 보이도록 이동한다. */}
            <Canvas
              key={system}
              viewKey={`ff.view.${system}`}
              focus={{ id: isTokenScreen(screen) ? screen : null, token: focusToken, nonce: focusNonce }}
              positions={boards}
              images={Object.entries(images).map(([id, image]) => ({ ...image, id, src: imageUrl(system, image.file) }))}
              selectedItems={selected}
              onSelectItems={select}
              selectedBoards={selectedBoards}
              onSelectBoards={setSelectedBoards}
              onMove={moveBoards}
              boards={TOKEN_SCREEN_IDS.map((id) => ({
                id,
                title: TOKEN_SCREENS[id].title,
                content: (
                  <>
                    {id === 'color' && colorGroups.size > 0 && (
                      <div className="mb-4 flex justify-end">
                        <AddColorButtons onAddGroup={sectionProps.onAddGroup} onAddSolo={sectionProps.onAddSolo} />
                      </div>
                    )}
                    <KindSections kinds={TOKEN_SCREENS[id].kinds} {...sectionProps} />
                  </>
                ),
              }))}
            />
          </main>
        ) : (
          <main
            className="min-w-0 flex-1 overflow-y-auto bg-workspace p-6"
            onClick={(e) => {
              // 항목이나 버튼이 아닌 빈 곳을 누르면 선택을 푼다.
              if ((e.target as HTMLElement).closest('button, input, a, label')) return
              if (selected.length) select([])
              if (cells.length) selectCells([])
            }}
          >
            {loadError ? (
              <EmptyState title="불러오지 못했어요" body={loadError} />
            ) : systems === null ? null : !system ? (
              <div className="mx-auto mt-16 w-[360px] rounded-lg border border-hairline bg-canvas p-6">
                <p className="mb-4 text-base font-[650]">첫 디자인 시스템을 만들어 보세요</p>
                <NewSystemForm
                  onCreated={(name) => {
                    setSystems((list) => [...(list ?? []), name].sort())
                    openSystem(name)
                  }}
                />
              </div>
            ) : isTokenScreen(screen) ? null : screen === 'components' ? (
              comp ? (
                <ComponentScreen
                  comp={comp}
                  tokens={tokens}
                  cells={cells}
                  onSelect={pickCell}
                  onAddVariant={addVariant}
                  onAddSize={addSize}
                  onRenameVariant={(index) => renamePartInPanel('variants', index)}
                  onRenameSize={(index) => renamePartInPanel('sizes', index)}
                />
              ) : (
                <div className="mx-auto max-w-[960px]">
                  <h1 className="mb-4 flex h-8 items-center text-base font-[650]">컴포넌트</h1>
                  <div className="rounded-lg border border-hairline bg-canvas">
                    <EmptyState title="첫 컴포넌트를 만들어 보세요">
                      <Button onClick={() => setAddingComp(true)}>
                        <Plus size={16} strokeWidth={1.5} />
                        컴포넌트 추가
                      </Button>
                    </EmptyState>
                  </div>
                </div>
              )
            ) : screen !== 'canvas' ? (
              <div className="mx-auto max-w-[960px]">
                <h1 className="mb-4 flex h-8 items-center text-base font-[650]">{PLACEHOLDER_SCREENS[screen].title}</h1>
                <div className="rounded-lg border border-hairline bg-canvas">
                  <EmptyState title="다음 단계에서 만들 화면이에요" />
                </div>
              </div>
            ) : null}
          </main>
        )}

        {/* 보여 줄 것이 없으면(아무것도 선택하지 않았으면) 패널 자체를 없애 가운데를 넓게 쓴다. */}
        <aside
          className="w-[280px] shrink-0 overflow-y-auto border-l border-hairline empty:hidden"
          // 입력칸을 눌러 들어가면 적혀 있던 글자를 모두 선택해서 바로 고쳐 쓸 수 있게 한다. 이미 들어가 있는 칸을 다시 누르면 평소처럼 커서가 놓인다.
          onMouseDownCapture={(e) => {
            const input = e.target
            if (!(input instanceof HTMLInputElement) || input.readOnly || document.activeElement === input) return
            if (input.type !== 'text' && input.type !== '') return
            e.preventDefault()
            input.focus()
            input.select()
          }}
        >
          {bare ? null : ready && screen === 'components' && comp ? (
            <ComponentInspector
              key={`${compIndex}-${selectionId}`}
              comp={comp}
              cells={cells}
              tokens={tokens}
              file={compFile}
              otherNames={comps.filter((c) => c !== comp).map((c) => c.name)}
              onChange={changeComp}
              onDeleteVariant={(index) =>
                removePart(() =>
                  changeComp({ ...comp, variants: comp.variants.filter((_, i) => i !== index) }),
                )
              }
              onDeleteSize={(index) =>
                removePart(() =>
                  changeComp({ ...comp, sizes: comp.sizes.filter((_, i) => i !== index) }),
                )
              }
              onDuplicateVariant={duplicateVariant}
              onDuplicateSize={duplicateSize}
              onCopyCss={() => copyText(compCss(comp), 'CSS를 복사했어요.')}
              onDelete={() =>
                removePart(() => {
                  commitComps(comps.filter((c) => c !== comp))
                  setCompIndex(0)
                })
              }
            />
          ) : pickedBoards.length > 0 && selectedTokens.length === 0 && pickedBoards.every((b) => b.id in images) ? (
            <ImageInspector picked={pickedBoards} onMove={moveBoards} />
          ) : pickedBoards.length > 0 && selectedTokens.length === 0 ? (
            <BoardInspector
              picked={pickedBoards}
              styles={boards}
              titles={Object.fromEntries(TOKEN_SCREEN_IDS.map((id) => [id, TOKEN_SCREENS[id].title]))}
              onMove={moveBoards}
            />
          ) : selectedTokens.length === 1 && commonKind ? (
            <Inspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              file={file}
              allNames={tokens.map((t) => t.name)}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onValue={(value) =>
                commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, value } : t)))
              }
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
              onPickColor={pickColor}
              scaleMissing={scaleOf(selectedTokens[0].name)?.missing.length ?? null}
              onMakeScale={() => fillScale(selectedTokens[0].name)}
            />
          ) : selectedTokens.length > 1 ? (
            <MultiInspector
              key={selectionId}
              tokens={selectedTokens}
              group={wholeGroup}
              onRenameGroup={(next) => (wholeGroup ? renameGroup(wholeGroup, next) : null)}
              onRename={() => setBatch(true)}
            />
          ) : null}
        </aside>
      </div>

      {creating && (
        <Modal title="새 디자인 시스템" onClose={() => setCreating(false)}>
          <NewSystemForm
            onCancel={() => setCreating(false)}
            onCreated={(name) => {
              setCreating(false)
              setSystems((list) => [...(list ?? []), name].sort())
              openSystem(name)
            }}
          />
        </Modal>
      )}

      {pasting && (
        <PasteDialog
          job={pasting}
          onCancel={() => setPasting(null)}
          onPaste={({ overwrite, adopt }) => paste([...pasting.pasted, ...(adopt ? pasting.adoptable : [])], pasting.into, overwrite)}
        />
      )}

      {addingSolo && (
        <Modal title="단독 색 추가" onClose={() => setAddingSolo(false)}>
          <NewSoloForm
            // 단독 색의 이름은 다른 단독 색과도, 목록 이름과도 겹치면 안 된다.
            existing={new Set([...colorGroups, ...tokens.filter((t) => COLOR.matches(t.name)).map((t) => shortName(COLOR, t.name))])}
            onCancel={() => setAddingSolo(false)}
            onCreate={addSolo}
          />
        </Modal>
      )}

      {addingFirst !== null && (
        <Modal title={`${addingFirst}의 첫 색`} onClose={() => setAddingFirst(null)}>
          <NewGroupForm
            existing={colorGroups}
            group={addingFirst}
            onCancel={() => setAddingFirst(null)}
            onCreate={(group, step, value, scale) => {
              setAddingFirst(null)
              addGroup(group, step, value, scale)
            }}
          />
        </Modal>
      )}

      {addingGroup && (
        <Modal title="색 목록 추가" onClose={() => setAddingGroup(false)}>
          <NewGroupForm existing={colorGroups} onCancel={() => setAddingGroup(false)} onCreate={addGroup} />
        </Modal>
      )}

      {addingComp && (
        <Modal title="컴포넌트 추가" onClose={() => setAddingComp(false)}>
          <NewNameForm
            label="컴포넌트 이름"
            placeholder="button"
            existing={new Set(comps.map((c) => c.name))}
            onCancel={() => setAddingComp(false)}
            onCreate={addComp}
          />
        </Modal>
      )}

      {batch && selectedTokens.length > 1 && (
        <BatchRename picked={selectedTokens} allNames={tokens.map((t) => t.name)} onApply={renameMany} onClose={() => setBatch(false)} />
      )}
      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
      {help && <Shortcuts onClose={() => setHelp(false)} />}
      {notice && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex h-8 -translate-x-1/2 items-center rounded-md bg-ink px-3 text-sm whitespace-nowrap text-white shadow-float"
        >
          {notice}
        </div>
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="text-ink-soft">{confirm.body}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              취소
            </Button>
            <Button variant="primary" onClick={confirm.run}>
              삭제
            </Button>
          </div>
        </Modal>
      )}
    </div>
    </SwatchContext.Provider>
  )
}

function NewNameForm({
  label,
  placeholder,
  existing,
  onCreate,
  onCancel,
}: {
  label: string
  placeholder: string
  existing: Set<string>
  onCreate: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('이름을 입력해 주세요.')
    if (!SLUG.test(trimmed)) return setError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (existing.has(trimmed)) return setError('같은 이름이 이미 있어요.')
    onCreate(trimmed)
  }

  return (
    <form onSubmit={submit}>
      <Field label={label} error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder={placeholder}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          추가
        </Button>
      </div>
    </form>
  )
}
