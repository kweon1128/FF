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
import { STATES, freshName, newComp, newSize, newVariant, normalize, renameRef, type Cell, type Comp } from './lib/components'
import type { Placed } from './lib/arrange'
import { BoardInspector } from './BoardInspector'
import { BOARD_WIDTH, Canvas, defaultPos } from './Canvas'
import { ComponentInspector } from './ComponentInspector'
import { ComponentScreen } from './ComponentScreen'
import { Inspector, MultiInspector } from './Inspector'
import { Nav } from './Nav'
import { NewSystemForm } from './NewSystem'
import { AddGroupButton, KindSections, TokenScreen } from './TokenScreen'
import { TopBar, type SaveStatus } from './TopBar'
import { Button, EmptyState, Field, Modal, inputClass } from './ui'

const LAST_SYSTEM_KEY = 'ff.system'
const SAVE_DELAY = 300
const COLOR = KINDS.color

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
    setConfirm({
      title: names.length === 1 ? '이 값을 삭제할까요?' : `값 ${names.length}개를 삭제할까요?`,
      body:
        names.length === 1 ? (
          <>
            <span className="font-[550] text-ink">{kind ? shortName(kind, names[0]) : names[0]}</span> 값을 파일에서
            지워요. 되돌릴 수 없어요.
          </>
        ) : (
          <>선택한 값 {names.length}개를 파일에서 지워요. 되돌릴 수 없어요.</>
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
  }

  function changeScreen(id: ScreenId) {
    setScreen(id)
    setSelectedBoards([])
    select([])
    setCells([])
  }

  // 컴포넌트
  const comp = comps[compIndex] ?? null

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
          <span className="font-[550] text-ink">{name}</span> {what}를 파일에서 지워요. 되돌릴 수 없어요.
        </>
      ),
      run: () => {
        run()
        selectCells([])
        setConfirm(null)
      },
    })
  }

  // 단축키: Ctrl+Z 되돌리기, Ctrl+Shift+Z 다시 실행, Delete·Backspace 삭제, Esc 선택 풀기, Ctrl+A 모두 선택. 최신 상태를 보도록 매번 새 함수를 담아 둔다.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = (e) => {
    const t = e.target
    const typing =
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
    if (typing || document.querySelector('[role="dialog"]')) return

    const mod = e.ctrlKey || e.metaKey
    if (mod && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault()
      const { undo, redo } = history.current
      // Ctrl+Z 되돌리기, Ctrl+Shift+Z(또는 Ctrl+Y) 다시 실행.
      if (e.code === 'KeyY' || e.shiftKey) travel(redo, undo)
      else travel(undo, redo)
    } else if (e.code === 'Escape') {
      if (selected.length) select([])
      if (cells.length) selectCells([])
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
    screen === 'canvas'
      ? selectedBoards.map((id) => {
          const pos = boards[id] ?? defaultPos(TOKEN_SCREEN_IDS.indexOf(id as TokenScreenId))
          const h = document.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
          return { id, x: pos.x, y: pos.y, w: pos.w ?? BOARD_WIDTH, h }
        })
      : []

  return (
    <div className="flex h-full flex-col">
      <TopBar
        systems={systems ?? []}
        current={system}
        status={status}
        saveError={saveError}
        onSelect={openSystem}
        onNew={() => setCreating(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Nav
          screen={screen}
          onSelect={changeScreen}
          components={comps.map((c) => c.name)}
          currentComponent={compIndex}
          onPickComponent={(index) => {
            setCompIndex(index)
            selectCells([])
          }}
          onAddComponent={() => setAddingComp(true)}
        />

        {ready && screen === 'canvas' ? (
          <main className="min-w-0 flex-1">
            <Canvas
              key={system}
              viewKey={`ff.view.${system}`}
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
            ) : isTokenScreen(screen) ? (
              <TokenScreen title={TOKEN_SCREENS[screen].title} kinds={TOKEN_SCREENS[screen].kinds} {...sectionProps} />
            ) : screen === 'components' ? (
              comp ? (
                <ComponentScreen
                  comp={comp}
                  tokens={tokens}
                  cells={cells}
                  onSelect={pickCell}
                  onAddVariant={addVariant}
                  onAddSize={addSize}
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

        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-hairline">
          {ready && screen === 'components' && comp ? (
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
            />
          ) : selectedTokens.length > 1 ? (
            <MultiInspector
              key={selectionId}
              tokens={selectedTokens}
              kind={commonKind}
              onValue={(value) => commit(tokens.map((t) => (selected.includes(t.name) ? { ...t, value } : t)))}
              onDelete={() => askRemoveTokens(selectedTokens.map((t) => t.name))}
            />
          ) : (
            <p className="p-4 text-ink-faint">
              항목을 선택하면 여기서 값을 고칠 수 있어요. Shift를 누른 채 누르면 여러 개를 함께 선택해요.
            </p>
          )}
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
