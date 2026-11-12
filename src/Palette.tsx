import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export type PaletteItem = {
  id: string
  label: string
  /** 오른쪽에 옅게 붙는 설명(값, 단축키 등). */
  hint?: string
  /** 무엇인지 알려 주는 짧은 말(화면, 값, 명령). */
  group: string
  /** 화면에는 안 보이지만 찾을 때 함께 보는 글자(변수 이름 등). */
  search?: string
  run: () => void
}

const LIMIT = 50

/** 빠른 실행. 화면, 값, 명령을 이름으로 찾아 바로 실행한다. */
export function Palette({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const list = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const found = (q ? items.filter((i) => `${i.label} ${i.hint ?? ''} ${i.group} ${i.search ?? ''}`.toLowerCase().includes(q)) : items).slice(0, LIMIT)
  const at = Math.min(index, Math.max(found.length - 1, 0))

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [at, q])

  function run(item: PaletteItem | undefined) {
    if (!item) return
    onClose()
    item.run()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[18vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="빠른 실행" className="w-[480px] overflow-hidden rounded-lg border border-hairline bg-canvas shadow-dialog">
        <label className="flex h-11 items-center gap-2 border-b border-hairline px-3">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-ink-faint" />
          <input
            autoFocus
            aria-label="찾기"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            placeholder="화면, 값, 명령 찾기"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                const step = e.key === 'ArrowDown' ? 1 : -1
                setIndex((at + step + found.length) % Math.max(found.length, 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                run(found[at])
              } else if (e.key === 'Escape') onClose()
            }}
          />
        </label>
        <div ref={list} role="listbox" className="max-h-[320px] overflow-y-auto p-1">
          {found.length === 0 ? (
            <p className="px-2 py-6 text-center text-ink-faint">맞는 것이 없어요.</p>
          ) : (
            found.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={i === at}
                onPointerMove={() => setIndex(i)}
                onClick={() => run(item)}
                className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left ${i === at ? 'bg-hover' : ''}`}
              >
                <span className="w-10 shrink-0 text-xs text-ink-faint">{item.group}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && <span className="max-w-[45%] shrink-0 truncate font-mono text-xs text-ink-faint">{item.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
