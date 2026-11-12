import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  getCanvas,
  getComponents,
  getTokens,
  listSystems,
  putCanvas,
  putComponents,
  putTokens,
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
  type Comp,
} from './lib/components'
import { duplicateTokens, fromCss, kindOf, pasteTokens, shiftTokens, toCss } from './lib/tokens'
import type { Placed } from './lib/arrange'
import { BoardInspector } from './BoardInspector'
import { BOARD_WIDTH, Canvas, defaultPos } from './Canvas'
import { ComponentInspector } from './ComponentInspector'
import { ComponentScreen } from './ComponentScreen'
import { Inspector, MultiInspector } from './Inspector'
import { Nav } from './Nav'
import { NewSystemForm } from './NewSystem'
import { Palette, type PaletteItem } from './Palette'
import { RenameBox, type Renaming } from './Rename'
import { Shortcuts } from './Shortcuts'
import { AddGroupButton, KindSections } from './TokenScreen'
import { TopBar, type SaveStatus } from './TopBar'
import { Button, EmptyState, Field, Modal, inputClass } from './ui'

const LAST_SYSTEM_KEY = 'ff.system'
const SAVE_DELAY = 300
const COLOR = KINDS.color
const NAME_RULE = '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
const NAME_TAKEN = '같은 이름이 이미 있어요.'
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

  const flush = useCallback(async () => {
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
  }, [save, report])

  const queue = useCallback(
    (system: string, data: T) => {
      report('saving')
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = { system, data, timer: window.setTimeout(flush, SAVE_DELAY) }
    },
    [flush, report],
  )

  return { queue, flush }
}

/** 되돌리기를 위해 기억해 두는 한 시점의 내용. */
type Snapshot = { tokens: Token[]; comps: Comp[]; boards: Record<string, Pos> }

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
  const [addingComp, setAddingComp] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  // 빠른 실행에서 값을 고르면 그 값이 화면 가운데에 오게 한다.
  const [focusToken, setFocusToken] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<Renaming | null>(null)
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  // 메뉴와 패널을 숨기고 가운데만 보는 상태(Ctrl+\).
  const [bare, setBare] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef(0)

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

  const report = useCallback<SaveReport>((result) => {
    if (typeof result === 'string') return setStatus(result)
    setStatus('error')
    setSaveError(result.message || null)
  }, [])

  const tokenSaver = useSaver<Token[]>(putTokens, report)
  const compSaver = useSaver<Comp[]>(putComponents, report)
  const flushTokens = tokenSaver.flush
  const flushComps = compSaver.flush

  const openSystem = useCallback(
    async (name: string) => {
      await Promise.all([flushTokens(), flushComps()])
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
        const [data, canvas, components] = await Promise.all([getTokens(name), getCanvas(name), getComponents(name)])
        setTokens(data.tokens)
        setFile(data.file)
        setBoards(canvas.boards)
        setComps(normalize(components.components))
        setCompFile(components.file)
      } catch (e) {
        setTokens([])
        setBoards({})
        setComps([])
        setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.')
      }
    },
    [flushTokens, flushComps],
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

  // 되돌리기와 다시 실행. 파일 내용(값, 컴포넌트, 판 위치)이 바뀌기 직전의 모습을 쌓아 둔다.
  const history = useRef<{ undo: Snapshot[]; redo: Snapshot[]; at: number }>({ undo: [], redo: [], at: 0 })

  function record() {
    const h = history.current
    const now = Date.now()
    if (now - h.at > HISTORY_GROUP) {
      h.undo.push({ tokens, comps, boards })
      if (h.undo.length > HISTORY_LIMIT) h.undo.shift()
    }
    h.at = now
    h.redo = []
  }

  function saveBoards(next: Record<string, Pos>) {
    if (!system) return
    setBoards(next)
    setStatus('saving')
    putCanvas(system, next)
      .then(() => setStatus('saved'))
      .catch((e) => report(e instanceof Error ? e : new Error()))
  }

  /** from에서 하나를 꺼내 그 모습으로 돌아가고, 지금 모습은 to에 쌓는다. */
  function travel(from: Snapshot[], to: Snapshot[]) {
    const snap = from.pop()
    if (!snap || !system) return
    to.push({ tokens, comps, boards })
    history.current.at = 0
    if (snap.tokens !== tokens) {
      setTokens(snap.tokens)
      tokenSaver.queue(system, snap.tokens)
    }
    if (snap.comps !== comps) {
      setComps(snap.comps)
      compSaver.queue(system, snap.comps)
    }
    if (snap.boards !== boards) saveBoards(snap.boards)
    // 없어진 항목은 선택에서 빼고, 편집 패널은 새 값으로 다시 그린다.
    setSelected(selected.filter((name) => snap.tokens.some((t) => t.name === name)))
    const comp = snap.comps[compIndex]
    setCells(comp ? cells.filter((c) => c.v < comp.variants.length && c.s < comp.sizes.length) : [])
    if (!comp) setCompIndex(0)
    setSelectionId((n) => n + 1)
  }

  function commit(next: Token[]) {
    if (!system) return
    record()
    setTokens(next)
    tokenSaver.queue(system, next)
  }

  function commitComps(next: Comp[]) {
    if (!system) return
    record()
    setComps(next)
    compSaver.queue(system, next)
  }

  function select(names: string[]) {
    setSelected(names)
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

    if (kind.id === 'color' && group) {
      const inGroup = (t: Token) => kind.matches(t.name) && groupOf(shortName(kind, t.name)) === group
      const steps = tokens.filter(inGroup).map((t) => shortName(kind, t.name).slice(group.length + 1))
      return insert({ name: `${kind.prefix}${group}-${nextStep(steps)}`, value: kind.defaultValue }, inGroup)
    }

    let name = `${kind.prefix}new`
    for (let i = 2; names.has(name); i++) name = `${kind.prefix}new${i}`
    insert({ name, value: kind.defaultValue }, (t) => kind.matches(t.name))
  }

  function addGroup(group: string) {
    setAddingGroup(false)
    insert({ name: `${COLOR.prefix}${group}-100`, value: COLOR.defaultValue }, (t) => COLOR.matches(t.name))
  }

  function renameToken(from: string, to: string) {
    commit(tokens.map((t) => (t.name === from ? { ...t, name: to } : t)))
    setSelected([to])
    // 이 값을 가리키던 컴포넌트도 새 이름을 따라가게 한다.
    if (JSON.stringify(comps).includes(`"${from}"`)) commitComps(renameRef(comps, from, to))
  }

  function removeTokens(names: string[]) {
    commit(tokens.filter((t) => !names.includes(t.name)))
    select([])
    setConfirm(null)
  }

  function askRemoveTokens(names: string[]) {
    const kind = ALL_KINDS.find((k) => k.matches(names[0]))
    const used = names.filter((n) => usesOf(comps, n).length > 0).length
    const warning =
      used > 0 ? (
        <span className="mt-2 block">
          {names.length === 1 ? '컴포넌트에서 쓰고 있는 값이에요.' : `컴포넌트에서 쓰고 있는 값이 ${used}개 있어요.`} 지우면 그 자리는
          비게 돼요.
        </span>
      ) : null
    setConfirm({
      title: names.length === 1 ? '이 값을 삭제할까요?' : `값 ${names.length}개를 삭제할까요?`,
      body:
        names.length === 1 ? (
          <>
            <span className="font-[550] text-ink">{kind ? shortName(kind, names[0]) : names[0]}</span> 값을 파일에서
            지워요.
            {warning}
          </>
        ) : (
          <>
            선택한 값 {names.length}개를 파일에서 지워요.
            {warning}
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
    for (const [id, patch] of Object.entries(moved)) {
      next[id] = { ...(boards[id] ?? defaultPos(TOKEN_SCREEN_IDS.indexOf(id as TokenScreenId))), ...patch }
    }
    saveBoards(next)
    // 숨긴 판은 선택에서 뺀다.
    const gone = Object.keys(moved).filter((id) => moved[id].hidden)
    if (gone.length) setSelectedBoards((ids) => ids.filter((id) => !gone.includes(id)))
  }

  function changeScreen(id: ScreenId) {
    setScreen(id)
    setFocusToken(null)
    // 숨겨 둔 판의 메뉴를 누르면 다시 보이게 한다.
    if (isTokenScreen(id) && boards[id]?.hidden) moveBoards({ [id]: { hidden: false } })
    // 같은 메뉴를 다시 눌러도 그 판으로 다시 이동하게 한다.
    setFocusNonce((n) => n + 1)
    setSelectedBoards([])
    select([])
    setCells([])
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

  /** 값의 이름을 그 자리에서 고친다(더블클릭, Ctrl+R). */
  function renameTokenInline(name: string) {
    const kind = kindOf(name)
    const el = document.querySelector<HTMLElement>(`[data-token="${CSS.escape(name)}"]`)
    const anchor = el?.querySelector<HTMLElement>('[data-name]') ?? el
    if (!kind || !anchor) return
    setRenaming({
      rect: anchor.getBoundingClientRect(),
      value: shortName(kind, name),
      check: (next) => (!SLUG.test(next) ? NAME_RULE : tokens.some((t) => t.name === kind.prefix + next) ? NAME_TAKEN : null),
      commit: (next) => {
        renameToken(name, kind.prefix + next)
        setSelectionId((n) => n + 1)
      },
    })
  }

  function renamePartInline(part: 'variants' | 'sizes', index: number, rect: DOMRect) {
    if (!comp) return
    const list: { name: string }[] = comp[part]
    setRenaming({
      rect,
      value: list[index].name,
      check: (next) => (!SLUG.test(next) ? NAME_RULE : list.some((p) => p.name === next) ? NAME_TAKEN : null),
      commit: (next) => {
        changeComp({ ...comp, [part]: list.map((p, i) => (i === index ? { ...p, name: next } : p)) })
        setSelectionId((n) => n + 1)
      },
    })
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
      commit(tokens.map((t) => (names.includes(t.name) ? { ...t, value: hex } : t)))
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
      e.clipboardData?.setData('text/plain', toCss(picked))
      e.preventDefault()
      return notify(`값 ${picked.length}개를 복사했어요.`)
    }
    const pasted = fromCss(e.clipboardData?.getData('text/plain') ?? '')
    if (pasted.length === 0) return
    e.preventDefault()
    // 색 값을 선택해 둔 채 붙이면 그 색이 속한 목록으로 들어간다.
    const target = selected.findLast((n) => COLOR.matches(n))
    const { next, added } = pasteTokens(tokens, pasted, target ? groupOf(shortName(COLOR, target)) : null)
    commit(next)
    select(added)
    notify(`값 ${added.length}개를 붙여넣었어요.`)
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

  function askRemove(what: string, name: string, run: () => void) {
    setConfirm({
      title: `이 ${what}를 삭제할까요?`,
      body: (
        <>
          <span className="font-[550] text-ink">{name}</span> {what}를 파일에서 지워요.
        </>
      ),
      run: () => {
        run()
        selectCells([])
        setConfirm(null)
      },
    })
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
    // 글자를 쓰는 중에도 되는 것: 빠른 실행(Ctrl+K), 단축키 목록(Ctrl+Shift+?), 메뉴와 패널 숨기기(Ctrl+\).
    if (mod && !e.altKey && !dialog) {
      const run = (action: () => void) => {
        e.preventDefault()
        action()
      }
      if (!e.shiftKey && (e.code === 'KeyK' || e.code === 'Slash')) return run(() => setPalette(true))
      if (e.shiftKey && e.code === 'Slash') return run(() => setHelp(true))
      if (!e.shiftKey && e.code === 'Backslash') return run(toggleBare)
    }
    if (isTyping(e.target) || dialog) return

    if (mod && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault()
      const { undo, redo } = history.current
      // Ctrl+Z 되돌리기, Ctrl+Shift+Z(또는 Ctrl+Y) 다시 실행.
      if (e.code === 'KeyY' || e.shiftKey) travel(redo, undo)
      else travel(undo, redo)
    } else if (e.code === 'Escape') {
      if (selected.length) select([])
      if (cells.length) selectCells([])
    } else if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyD') {
      e.preventDefault()
      duplicate()
    } else if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyR') {
      // 하나를 선택했을 때만 이름 바꾸기로 쓴다. 그 밖에는 브라우저의 새로 고침 그대로다.
      const cell = cells.at(-1)
      if (screen === 'components' && cell) {
        const label = document.querySelector<HTMLElement>(`[data-variant-name="${cell.v}"]`)
        if (!label) return
        e.preventDefault()
        renamePartInline('variants', cell.v, label.getBoundingClientRect())
      } else if (screen !== 'components' && selected.length === 1) {
        e.preventDefault()
        renameTokenInline(selected[0])
      }
    } else if (mod && !e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft')) {
      if (screen === 'components' || selected.length === 0) return
      e.preventDefault()
      commit(shiftTokens(tokens, selected, e.code === 'BracketRight' ? 1 : -1))
    } else if (e.code === 'Tab' && !mod && !e.altKey) {
      if (stepSelection(e.shiftKey ? -1 : 1)) e.preventDefault()
    } else if (e.code === 'KeyI' && !mod && !e.altKey && !e.shiftKey) {
      if (screen !== 'components') pickColor()
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
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
    onRename: renameTokenInline,
  }

  const colorGroups = new Set(
    tokens.filter((t) => COLOR.matches(t.name)).map((t) => groupOf(shortName(COLOR, t.name))),
  )
  const selectedTokens = tokens.filter((t) => selected.includes(t.name))
  const selectedKinds = selectedTokens.map((t) => ALL_KINDS.find((k) => k.matches(t.name)) ?? null)
  const commonKind = selectedKinds.every((k) => k === selectedKinds[0]) ? (selectedKinds[0] ?? null) : null
  const ready = !loadError && systems !== null && system !== null

  // 선택한 판들의 자리와 크기. 높이는 내용에 따라 정해지므로 화면에서 잰다.
  const pickedBoards: Placed[] =
    screen === 'canvas' || isTokenScreen(screen)
      ? selectedBoards.map((id) => {
          const pos = boards[id] ?? defaultPos(TOKEN_SCREEN_IDS.indexOf(id as TokenScreenId))
          const h = document.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
          return { id, x: pos.x, y: pos.y, w: pos.w ?? BOARD_WIDTH, h }
        })
      : []

  // 빠른 실행에 나오는 것들: 화면, 컴포넌트, 값, 명령.
  const paletteItems: PaletteItem[] = !palette
    ? []
    : [
        { id: 's:canvas', group: '화면', label: '전체 보기', run: () => changeScreen('canvas') },
        ...TOKEN_SCREEN_IDS.map((id) => ({ id: `s:${id}`, group: '화면', label: TOKEN_SCREENS[id].title, run: () => changeScreen(id) })),
        ...comps.map((c, i) => ({ id: `c:${i}`, group: '화면', label: c.name, hint: '컴포넌트', run: () => openComp(i) })),
        { id: 'a:help', group: '명령', label: '단축키 목록', hint: 'Ctrl+Shift+?', run: () => setHelp(true) },
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
            hint: t.value,
            search: t.name,
            run: () => goToken(t.name),
          }
        }),
      ]

  return (
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
          <main className="min-w-0 flex-1">
            {/* 캔버스는 하나다. 왼쪽 메뉴의 색상·글꼴 등을 누르면 같은 캔버스에서 그 판이 화면에 맞게 보이도록 이동한다. */}
            <Canvas
              key={system}
              viewKey={`ff.view.${system}`}
              focus={{ id: isTokenScreen(screen) ? screen : null, token: focusToken, nonce: focusNonce }}
              positions={boards}
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
                        <AddGroupButton onAddGroup={sectionProps.onAddGroup} />
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
                <p className="text-base font-[650]">첫 디자인 시스템을 만들어 보세요</p>
                <p className="mt-1 mb-4 text-ink-soft">색, 글꼴, 간격을 모아 둘 공간이에요.</p>
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
                  onRenameVariant={(index, rect) => renamePartInline('variants', index, rect)}
                  onRenameSize={(index, rect) => renamePartInline('sizes', index, rect)}
                />
              ) : (
                <div className="mx-auto max-w-[960px]">
                  <h1 className="mb-4 flex h-8 items-center text-base font-[650]">컴포넌트</h1>
                  <div className="rounded-lg border border-hairline bg-canvas">
                    <EmptyState
                      title="첫 컴포넌트를 만들어 보세요"
                      body="버튼, 배지처럼 상자와 글자로 된 컴포넌트를 빈 상자에서부터 만들어요."
                    >
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
                  <EmptyState title="다음 단계에서 만들 화면이에요" body={PLACEHOLDER_SCREENS[screen].body} />
                </div>
              </div>
            ) : null}
          </main>
        )}

        {/* 보여 줄 것이 없으면(아무것도 선택하지 않았으면) 패널 자체를 없애 가운데를 넓게 쓴다. */}
        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-hairline empty:hidden">
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
                askRemove('종류', comp.variants[index].name, () =>
                  changeComp({ ...comp, variants: comp.variants.filter((_, i) => i !== index) }),
                )
              }
              onDeleteSize={(index) =>
                askRemove('크기', comp.sizes[index].name, () =>
                  changeComp({ ...comp, sizes: comp.sizes.filter((_, i) => i !== index) }),
                )
              }
              onDuplicateVariant={duplicateVariant}
              onDuplicateSize={duplicateSize}
              onCopyCss={() => copyText(compCss(comp), 'CSS를 복사했어요.')}
              onDelete={() =>
                askRemove('컴포넌트', comp.name, () => {
                  commitComps(comps.filter((c) => c !== comp))
                  setCompIndex(0)
                })
              }
            />
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
              onDelete={() => askRemoveTokens([selectedTokens[0].name])}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
              onPickColor={pickColor}
            />
          ) : selectedTokens.length > 1 ? (
            <MultiInspector
              key={selectionId}
              tokens={selectedTokens}
              kind={commonKind}
              onValue={(value) => commit(tokens.map((t) => (selected.includes(t.name) ? { ...t, value } : t)))}
              onDelete={() => askRemoveTokens(selectedTokens.map((t) => t.name))}
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

      {addingGroup && (
        <Modal title="색 목록 추가" onClose={() => setAddingGroup(false)}>
          <NewNameForm
            label="목록 이름"
            hint="primary, gray처럼 지어요. 첫 색 하나가 함께 만들어져요."
            placeholder="primary"
            existing={colorGroups}
            onCancel={() => setAddingGroup(false)}
            onCreate={addGroup}
          />
        </Modal>
      )}

      {addingComp && (
        <Modal title="컴포넌트 추가" onClose={() => setAddingComp(false)}>
          <NewNameForm
            label="컴포넌트 이름"
            hint="button, badge처럼 지어요. 빈 상자에서 시작해요."
            placeholder="button"
            existing={new Set(comps.map((c) => c.name))}
            onCancel={() => setAddingComp(false)}
            onCreate={addComp}
          />
        </Modal>
      )}

      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
      {help && <Shortcuts onClose={() => setHelp(false)} />}
      {renaming && <RenameBox job={renaming} onClose={() => setRenaming(null)} />}
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
  )
}

function NewNameForm({
  label,
  hint,
  placeholder,
  existing,
  onCreate,
  onCancel,
}: {
  label: string
  hint: string
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
      <Field label={label} error={error} hint={hint}>
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
