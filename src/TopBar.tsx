import { ICON_STROKE } from './lib/icons'
import { useEffect, useState } from 'react'
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
  // 메뉴가 떠 있을 때의 Esc는 메뉴만 닫는다(고르는 목록과 같다). 먼저 받지 않으면 판의 선택이 풀린다.
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      e.preventDefault()
      setOpen(false)
    }
    window.addEventListener('keydown', esc, true)
    return () => window.removeEventListener('keydown', esc, true)
  }, [open])

  return (
    <header className="flex h-bar shrink-0 items-center justify-between border-b-divider border-hairline px-bar-x">
      <div className="flex items-center gap-actions-tight">
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-control items-center gap-row-inner rounded-control px-button-ghost-x type-label outline-selection focus-visible:outline-focus hover:bg-hover"
        >
          <Folder size={16} strokeWidth={ICON_STROKE} />
          {current ?? '디자인 시스템 없음'}
          <ChevronDown size={16} strokeWidth={ICON_STROKE} className="text-ink-faint" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-menu-backdrop" onClick={() => setOpen(false)} />
            <div
              role="menu"
              // 줄 사이를 띄워, 마우스를 올린 바탕이 옆 줄과 붙지 않게 한다.
              // 버튼 바로 아래에서 4px 띄워 놓는다(고르는 목록과 같다). 버튼의 높이를 숫자로 다시 적지 않으므로 높이가 바뀌어도 붙어 다닌다.
              className="absolute top-full left-0 mt-[4px] z-menu w-menu space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu shadow-float"
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
                  // 지금 쓰는 줄은 다른 떠 있는 목록(고르는 칸의 목록)처럼 회색 바탕과 체크로 표시한다.
                  className={`flex h-row w-full items-center justify-between rounded-row px-row-x text-left outline-selection focus-visible:outline-focus hover:bg-hover ${name === current ? 'bg-hover' : ''}`}
                >
                  <span className="truncate">{name}</span>
                  {name === current && <Check size={16} strokeWidth={ICON_STROKE} />}
                </button>
              ))}
              {systems.length > 0 && <div className="my-menu border-t-divider border-hairline-soft" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onNew()
                }}
                className="flex h-row w-full items-center gap-row-inner rounded-row px-row-x text-left text-ink-soft outline-selection focus-visible:outline-focus hover:bg-hover hover:text-ink"
              >
                <Plus size={16} strokeWidth={ICON_STROKE} />디자인 시스템 만들기
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
            className="flex size-icon-button items-center justify-center rounded-control text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-disabled"
          >
            <Icon size={16} strokeWidth={ICON_STROKE} />
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
