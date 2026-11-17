import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Folder, Plus } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function TopBar({
  systems,
  current,
  status,
  saveError,
  onSelect,
  onNew,
  onBack,
  onForward,
}: {
  systems: string[]
  current: string | null
  status: SaveStatus
  saveError: string | null
  onSelect: (name: string) => void
  onNew: () => void
  /** 지나온 자리로 돌아간다. 돌아갈 곳이 없으면 주지 않는다(버튼이 꺼진다). */
  onBack?: () => void
  onForward?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-hairline px-3">
      <div className="flex items-center gap-1">
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 items-center gap-2 rounded-md px-2 type-label hover:bg-hover"
        >
          <Folder size={16} strokeWidth={1.5} />
          {current ?? '디자인 시스템 없음'}
          <ChevronDown size={16} strokeWidth={1.5} className="text-ink-faint" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="absolute top-9 left-0 z-20 w-60 rounded-lg border border-hairline bg-canvas p-1 shadow-float"
            >
              {systems.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onSelect(name)
                  }}
                  className="flex h-8 w-full items-center justify-between rounded-md px-2 text-left hover:bg-hover"
                >
                  <span className="truncate">{name}</span>
                  {name === current && <Check size={16} strokeWidth={1.5} />}
                </button>
              ))}
              {systems.length > 0 && <div className="my-1 border-t border-hairline-soft" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onNew()
                }}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-ink-soft hover:bg-hover hover:text-ink"
              >
                <Plus size={16} strokeWidth={1.5} />새 디자인 시스템
              </button>
            </div>
          </>
        )}
      </div>
        {/* 뒤로와 앞으로. "쓰이는 곳"이나 찾기로 건너뛴 뒤에, 떠나온 자리로 돌아가거나 다시 간다. 갈 곳이 없으면 꺼져 있다. 두 버튼의 바탕이 닿지 않게 4px 띄운다. */}
        {[
          { run: onBack, label: '뒤로', keys: 'Alt+←', Icon: ArrowLeft },
          { run: onForward, label: '앞으로', keys: 'Alt+→', Icon: ArrowRight },
        ].map(({ run, label, keys, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={`${label} (${keys})`}
            disabled={!run}
            onClick={run}
            className="flex size-8 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <Icon size={16} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <span className="type-caption" role="status">
        {status === 'saving' && <span className="text-ink-faint">저장 중…</span>}
        {status === 'saved' && <span className="text-success">저장됨</span>}
        {status === 'error' && <span className="text-danger">{saveError ?? '저장하지 못했어요.'}</span>}
      </span>
    </header>
  )
}
