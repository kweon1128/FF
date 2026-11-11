import { Component, Image, LayoutGrid, LayoutTemplate, Palette, Ruler, SquareRoundCorner, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ScreenId } from './lib/catalog'

type Item = { id: ScreenId; label: string; icon: LucideIcon }

const SECTIONS: { title?: string; items: Item[] }[] = [
  { items: [{ id: 'canvas', label: '전체 보기', icon: LayoutGrid }] },
  {
    title: '기본 값',
    items: [
      { id: 'color', label: '색상', icon: Palette },
      { id: 'type', label: '글꼴', icon: Type },
      { id: 'spacing', label: '간격', icon: Ruler },
      { id: 'radius', label: '모서리', icon: SquareRoundCorner },
    ],
  },
  {
    title: '만들기',
    items: [
      { id: 'components', label: '컴포넌트', icon: Component },
      { id: 'layouts', label: '화면 구조', icon: LayoutTemplate },
      { id: 'assets', label: '아이콘·이미지', icon: Image },
    ],
  },
]

export function Nav({ screen, onSelect }: { screen: ScreenId; onSelect: (id: ScreenId) => void }) {
  return (
    <nav className="w-[220px] shrink-0 overflow-y-auto border-r border-hairline p-2">
      {SECTIONS.map((section, i) => (
        <div key={i}>
          {section.title && <p className="px-2 pt-3 pb-1 text-xs font-[550] text-ink-faint">{section.title}</p>}
          <div className="space-y-0.5">
            {section.items.map(({ id, label, icon: Icon }) => {
              const selected = id === screen
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onSelect(id)}
                  className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left ${
                    selected ? 'bg-hover font-[550] text-ink' : 'text-ink-soft hover:bg-hover hover:text-ink'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
