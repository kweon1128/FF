import { ICON_STROKE } from './lib/icons'
import {
  CaseSensitive,
  Component,
  EyeOff,
  Image,
  LayoutGrid,
  LayoutTemplate,
  Lock,
  Monitor,
  Palette,
  Plus,
  Proportions,
  Tags,
  Ruler,
  RulerDimensionLine,
  Scaling,
  Sparkles,
  Layers,
  Square,
  SquareDashed,
  SquareRoundCorner,
  Squircle,
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
      { id: 'role', label: '의미 색', icon: Tags },
      { id: 'type', label: '글꼴', icon: Type },
      { id: 'style', label: '의미 글꼴', icon: CaseSensitive },
      { id: 'spacing', label: '간격', icon: Ruler },
      { id: 'spaceuse', label: '의미 간격', icon: RulerDimensionLine },
      { id: 'length', label: '크기', icon: Scaling },
      { id: 'sizeuse', label: '의미 크기', icon: Proportions },
      { id: 'corner', label: '모서리', icon: SquareRoundCorner },
      { id: 'radius', label: '의미 모서리', icon: Squircle },
      { id: 'thickness', label: '테두리', icon: Square },
      { id: 'border', label: '의미 테두리', icon: SquareDashed },
      { id: 'effect', label: '효과', icon: Sparkles },
      { id: 'z', label: '겹치는 차례', icon: Layers },
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

const ROW = 'flex h-row w-full items-center gap-row-inner rounded-row px-row-x text-left'
const IDLE = 'type-menu text-ink-soft hover:bg-hover hover:text-ink'

export function Nav({
  screen,
  onSelect,
  components,
  currentComponent,
  onPickComponent,
  onAddComponent,
  hidden,
  locked,
  onShow,
  onUnlock,
}: {
  screen: ScreenId
  onSelect: (id: ScreenId) => void
  components: string[]
  currentComponent: number
  onPickComponent: (index: number) => void
  onAddComponent: () => void
  /** 숨기거나 잠근 판. 메뉴 줄 오른쪽의 아이콘을 누르면 다시 보이거나 풀린다. */
  hidden: string[]
  locked: string[]
  onShow: (id: string) => void
  onUnlock: (id: string) => void
}) {
  // 줄의 오른쪽 끝에 놓이는 작은 버튼. 줄의 한가운데 높이에 오도록 위와 오른쪽을 (줄 높이 - 버튼 크기)의 절반만큼 띄운다.
  const MARK =
    'absolute [--edge:calc((var(--height-row)-var(--size-icon-button-corner))/2)] top-(--edge) right-(--edge) flex size-icon-button-corner items-center justify-center rounded-small text-ink-faint outline-selection hover:bg-canvas hover:text-ink focus-visible:outline-focus'
  return (
    <nav className="w-nav shrink-0 overflow-y-auto border-r-divider border-hairline p-nav">
      {SECTIONS.map((section, i) => (
        <div key={i}>
          {section.title && <p className="px-row-x pt-section-y pb-label type-label text-ink-faint">{section.title}</p>}
          <div className="space-y-rows">
            {section.items.map(({ id, label, icon: Icon }) => {
              const selected = id === screen
              return (
                <div key={id} className="relative space-y-rows">
                  <button
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => onSelect(id)}
                    className={`${ROW} ${selected ? 'bg-hover type-menu-strong text-ink' : IDLE}`}
                  >
                    <Icon size={16} strokeWidth={ICON_STROKE} />
                    <span className={hidden.includes(id) ? 'text-ink-faint' : ''}>{label}</span>
                  </button>
                  {hidden.includes(id) ? (
                    <button
                      type="button"
                      title="숨긴 판 다시 보이기"
                      aria-label={`${label} 판 다시 보이기`}
                      onClick={() => onShow(id)}
                      className={MARK}
                    >
                      <EyeOff size={16} strokeWidth={ICON_STROKE} />
                    </button>
                  ) : locked.includes(id) ? (
                    <button
                      type="button"
                      title="잠금 풀기"
                      aria-label={`${label} 판 잠금 풀기`}
                      onClick={() => onUnlock(id)}
                      className={MARK}
                    >
                      <Lock size={16} strokeWidth={ICON_STROKE} />
                    </button>
                  ) : null}

                  {/* 컴포넌트 화면에서는 메뉴 아래에 컴포넌트 목록을 펼친다. */}
                  {id === 'components' && selected && (
                    <>
                      {components.map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-pressed={index === currentComponent}
                          onClick={() => onPickComponent(index)}
                          className={`${ROW} ${index === currentComponent ? 'bg-selection-soft type-menu-strong text-ink' : IDLE}`}
                        >
                          {/* 윗줄의 아이콘 자리(16px)를 비워 이름을 윗줄의 글자에 맞춘다. 들여쓰기를 여백 값으로 따로 두지 않는다. */}
                          <span className="size-icon shrink-0" />
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                      <button type="button" onClick={onAddComponent} className={`${ROW} ${IDLE}`}>
                        <span className="size-icon shrink-0" />
                        <Plus size={16} strokeWidth={ICON_STROKE} />
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
