import {
  Component,
  Image,
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Palette,
  Plus,
  Ruler,
  Sparkles,
  Square,
  SquareRoundCorner,
  Type,
  Zap,
} from 'lucide-react'
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
      { id: 'border', label: '테두리', icon: Square },
      { id: 'effect', label: '효과', icon: Sparkles },
      { id: 'layout', label: '화면 크기', icon: Monitor },
      { id: 'motion', label: '움직임', icon: Zap },
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

const ROW = 'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left'
const IDLE = 'text-ink-soft hover:bg-hover hover:text-ink'

export function Nav({
  screen,
  onSelect,
  components,
  currentComponent,
  onPickComponent,
  onAddComponent,
}: {
  screen: ScreenId
  onSelect: (id: ScreenId) => void
  components: string[]
  currentComponent: number
  onPickComponent: (index: number) => void
  onAddComponent: () => void
}) {
  return (
    <nav className="w-[220px] shrink-0 overflow-y-auto border-r border-hairline p-2">
      {SECTIONS.map((section, i) => (
        <div key={i}>
          {section.title && <p className="px-2 pt-3 pb-1 text-xs font-[550] text-ink-faint">{section.title}</p>}
          <div className="space-y-0.5">
            {section.items.map(({ id, label, icon: Icon }) => {
              const selected = id === screen
              return (
                <div key={id} className="space-y-0.5">
                  <button
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => onSelect(id)}
                    className={`${ROW} ${selected ? 'bg-hover font-[550] text-ink' : IDLE}`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    {label}
                  </button>

                  {/* 컴포넌트 화면에서는 메뉴 아래에 컴포넌트 목록을 펼친다. */}
                  {id === 'components' && selected && (
                    <>
                      {components.map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-pressed={index === currentComponent}
                          onClick={() => onPickComponent(index)}
                          className={`${ROW} pl-8 ${index === currentComponent ? 'bg-selection-soft font-[550] text-ink' : IDLE}`}
                        >
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                      <button type="button" onClick={onAddComponent} className={`${ROW} pl-8 ${IDLE}`}>
                        <Plus size={16} strokeWidth={1.5} />
                        컴포넌트 추가
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
