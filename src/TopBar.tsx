import { useState } from 'react'
import { Check, ChevronDown, Folder, Plus } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function TopBar({
  systems,
  current,
  status,
  saveError,
  onSelect,
  onNew,
}: {
  systems: string[]
  current: string | null
  status: SaveStatus
  saveError: string | null
  onSelect: (name: string) => void
  onNew: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-hairline px-3">
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 items-center gap-2 rounded-md px-2 font-[550] hover:bg-hover"
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

      <span className="text-xs" role="status">
        {status === 'saving' && <span className="text-ink-faint">저장 중…</span>}
        {status === 'saved' && <span className="text-success">저장됨</span>}
        {status === 'error' && <span className="text-danger">{saveError ?? '저장하지 못했어요.'}</span>}
      </span>
    </header>
  )
}
