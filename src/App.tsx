import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { getCanvas, getTokens, listSystems, putCanvas, putTokens, type Pos, type Token } from './lib/api'
import {
  ALL_KINDS,
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
} from './lib/catalog'
import { Canvas } from './Canvas'
import { Inspector } from './Inspector'
import { Nav } from './Nav'
import { NewSystemForm } from './NewSystem'
import { AddGroupButton, KindSections, TokenScreen } from './TokenScreen'
import { TopBar, type SaveStatus } from './TopBar'
import { Button, EmptyState, Field, Modal, inputClass } from './ui'

const LAST_SYSTEM_KEY = 'ff.system'
const SAVE_DELAY = 300
const COLOR = ALL_KINDS[0]

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

export function App() {
  const [systems, setSystems] = useState<string[] | null>(null)
  const [system, setSystem] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [boards, setBoards] = useState<Record<string, Pos>>({})
  const [file, setFile] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [screen, setScreen] = useState<ScreenId>('canvas')
  const [selected, setSelected] = useState<string | null>(null)
  // 다른 항목을 고를 때만 올린다. 이름을 바꿀 때는 그대로 두어 입력 중인 칸이 유지되게 한다.
  const [selectionId, setSelectionId] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // 아직 파일에 쓰지 않은 변경. 값을 고칠 때마다 잠깐 기다렸다가 한 번에 저장한다.
  const pending = useRef<{ system: string; tokens: Token[]; timer: number } | null>(null)

  const flush = useCallback(async () => {
    const job = pending.current
    if (!job) return
    pending.current = null
    window.clearTimeout(job.timer)
    try {
      await putTokens(job.system, job.tokens)
      if (!pending.current) setStatus('saved')
    } catch (e) {
      setStatus('error')
      setSaveError(e instanceof Error ? e.message : null)
    }
  }, [])

  const openSystem = useCallback(
    async (name: string) => {
      await flush()
      setSystem(name)
      setSelected(null)
      setStatus('idle')
      setLoadError(null)
      remember(name)
      try {
        const [data, canvas] = await Promise.all([getTokens(name), getCanvas(name)])
        setTokens(data.tokens)
        setFile(data.file)
        setBoards(canvas.boards)
      } catch (e) {
        setTokens([])
        setBoards({})
        setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.')
      }
    },
    [flush],
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

  function commit(next: Token[]) {
    if (!system) return
    setTokens(next)
    setStatus('saving')
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = { system, tokens: next, timer: window.setTimeout(flush, SAVE_DELAY) }
  }

  function select(name: string | null) {
    setSelected(name)
    setSelectionId((n) => n + 1)
  }

  function insert(token: Token, after: (t: Token) => boolean) {
    const last = tokens.findLastIndex(after)
    const at = last === -1 ? tokens.length : last + 1
    commit([...tokens.slice(0, at), token, ...tokens.slice(at)])
    select(token.name)
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
    setSelected(to)
  }

  function removeToken(name: string) {
    commit(tokens.filter((t) => t.name !== name))
    select(null)
    setDeleting(null)
  }

  function moveBoard(id: string, pos: Pos) {
    if (!system) return
    const next = { ...boards, [id]: pos }
    setBoards(next)
    setStatus('saving')
    putCanvas(system, next)
      .then(() => setStatus('saved'))
      .catch((e) => {
        setStatus('error')
        setSaveError(e instanceof Error ? e.message : null)
      })
  }

  function changeScreen(id: ScreenId) {
    setScreen(id)
    select(null)
  }

  const sectionProps = {
    tokens,
    selected,
    onSelect: select,
    onAdd: addToken,
    onAddGroup: () => setAddingGroup(true),
  }

  const colorGroups = new Set(
    tokens.filter((t) => COLOR.matches(t.name)).map((t) => groupOf(shortName(COLOR, t.name))),
  )
  const selectedToken = tokens.find((t) => t.name === selected) ?? null
  const selectedKind = selectedToken && ALL_KINDS.find((k) => k.matches(selectedToken.name))
  const deletingKind = deleting && ALL_KINDS.find((k) => k.matches(deleting))
  const ready = !loadError && systems !== null && system !== null

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
        <Nav screen={screen} onSelect={changeScreen} />

        {ready && screen === 'canvas' ? (
          <main className="min-w-0 flex-1">
            <Canvas
              key={system}
              viewKey={`ff.view.${system}`}
              positions={boards}
              onMove={moveBoard}
              onDeselect={() => select(null)}
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
              if (selected && !(e.target as HTMLElement).closest('button, input, a, label')) select(null)
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
          {selectedToken && selectedKind ? (
            <Inspector
              key={selectionId}
              token={selectedToken}
              kind={selectedKind}
              file={file}
              allNames={tokens.map((t) => t.name)}
              onRename={(to) => renameToken(selectedToken.name, to)}
              onValue={(value) =>
                commit(tokens.map((t) => (t.name === selectedToken.name ? { ...t, value } : t)))
              }
              onDelete={() => setDeleting(selectedToken.name)}
            />
          ) : (
            <p className="p-4 text-ink-faint">항목을 선택하면 여기서 값을 고칠 수 있어요.</p>
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
          <NewGroupForm existing={colorGroups} onCancel={() => setAddingGroup(false)} onCreate={addGroup} />
        </Modal>
      )}

      {deleting && deletingKind && (
        <Modal title="이 값을 삭제할까요?" onClose={() => setDeleting(null)}>
          <p className="text-ink-soft">
            <span className="font-[550] text-ink">{shortName(deletingKind, deleting)}</span> 값을 파일에서 지워요.
            되돌릴 수 없어요.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              취소
            </Button>
            <Button variant="primary" onClick={() => removeToken(deleting)}>
              삭제
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function NewGroupForm({
  existing,
  onCreate,
  onCancel,
}: {
  existing: Set<string>
  onCreate: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('목록 이름을 입력해 주세요.')
    if (!SLUG.test(trimmed)) return setError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (existing.has(trimmed)) return setError('같은 이름의 목록이 이미 있어요.')
    onCreate(trimmed)
  }

  return (
    <form onSubmit={submit}>
      <Field label="목록 이름" error={error} hint="primary, gray처럼 지어요. 첫 색 하나가 함께 만들어져요.">
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="primary"
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
