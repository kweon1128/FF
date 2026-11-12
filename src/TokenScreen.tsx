import type { CSSProperties, MouseEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Token } from './lib/api'
import { groupOf, shortName, type Kind } from './lib/catalog'
import { Button, EmptyState } from './ui'

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 Aa 123'

export type SectionProps = {
  tokens: Token[]
  /** 선택한 값의 이름들. Shift를 누른 채 누르면 여러 개가 담긴다. */
  selected: string[]
  /** additive가 참이면 지금 선택에 더하거나 뺀다. */
  onSelect: (name: string, additive: boolean) => void
  /** group은 색에서만 쓴다. ''는 목록에 속하지 않은 단독 색. */
  onAdd: (kind: Kind, group?: string) => void
  onAddGroup: () => void
  /** 항목을 더블클릭하면 그 자리에서 이름을 고친다. */
  onRename: (name: string) => void
}

/** Shift, Ctrl, Cmd 중 하나를 누른 채 누르면 여러 개 선택이다. */
export const isAdditive = (e: MouseEvent) => e.shiftKey || e.ctrlKey || e.metaKey

/** 한 화면에 속한 종류들을 차례로 그린다. 전체 보기의 판 안에서도 그대로 쓴다. */
export function KindSections({ kinds, tokens, selected, onSelect, onAdd, onAddGroup, onRename }: SectionProps & { kinds: Kind[] }) {
  const single = kinds.length === 1
  return (
    <div className="space-y-8">
      {kinds.map((kind) => {
        const items = tokens.filter((t) => kind.matches(t.name))
        const list = { kind, items, selected, onSelect, onAdd, onRename }
        return (
          <section key={kind.id}>
            {!single && <h2 className="mb-2 font-[650]">{kind.title}</h2>}
            {kind.id === 'color' ? (
              items.length === 0 ? (
                <div className="rounded-lg border border-hairline bg-canvas">
                  <EmptyState title={kind.emptyTitle} body={kind.emptyBody}>
                    <AddGroupButton onAddGroup={onAddGroup} />
                  </EmptyState>
                </div>
              ) : (
                <ColorGroups {...list} />
              )
            ) : kind.tiles ? (
              <TileGrid {...list} />
            ) : (
              <RowList {...list} />
            )}
          </section>
        )
      })}
    </div>
  )
}

export function AddGroupButton({ onAddGroup }: { onAddGroup: () => void }) {
  return (
    <Button onClick={onAddGroup}>
      <Plus size={16} strokeWidth={1.5} />
      목록 추가
    </Button>
  )
}

type ListProps = {
  kind: Kind
  items: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onAdd: (kind: Kind, group?: string) => void
  onRename: (name: string) => void
}

// 꼭짓점 사각형과 이름표는 확대 비율과 관계없이 화면에서 같은 크기로 보인다.
export const HANDLE = 'pointer-events-none absolute z-10 size-[7px] border border-selection bg-white [scale:var(--unzoom)]'

/** 선택한 항목의 네 꼭짓점에 붙는 작은 사각형. */
export function SelectionHandles() {
  return (
    <>
      <span className={`${HANDLE} -top-[3px] -left-[3px]`} />
      <span className={`${HANDLE} -top-[3px] -right-[3px]`} />
      <span className={`${HANDLE} -bottom-[3px] -left-[3px]`} />
      <span className={`${HANDLE} -right-[3px] -bottom-[3px]`} />
    </>
  )
}

/** 선택한 항목 바로 아래에 붙는 파란 이름표(이름 · 값). 주변에 무엇이 있든 가장 위에 겹쳐 보인다. */
export function SelectionTag({ name, value }: { name: string; value?: string }) {
  return (
    <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 origin-top -translate-x-1/2 [scale:var(--unzoom)] rounded-xs bg-selection px-1 text-xs leading-[18px] font-[550] whitespace-nowrap text-white">
      {value === undefined ? name : `${name} · ${value}`}
    </span>
  )
}

/** 꼭짓점 사각형과 이름표를 함께 붙인다. 항목 전체가 하나의 상자일 때 쓴다. */
export function SelectionLabel({ name, value }: { name: string; value?: string }) {
  return (
    <>
      <SelectionHandles />
      <SelectionTag name={name} value={value} />
    </>
  )
}

// 선택과 호버 표시. 선은 항목의 가장자리에 틈 없이 붙는다(안쪽으로 1px 겹쳐 원래 테두리를 덮는다).
// 피그마와 같게: 마우스를 올리면 2px 선, 선택하면 1px 선에 꼭짓점 사각형과 이름표가 붙는다.
// 선택된 항목도 마우스를 올리면 선이 2px로 두꺼워진다.
// 여러 개를 선택했을 때는 이름표끼리 겹치므로 선만 두른다.
export const OUTLINE = 'line-inset outline-selection'
export const SELECTED = 'line-1'
export const HOVER = 'hover:line-2 focus-visible:line-2'

export const ADD_TILE =
  'flex items-center justify-center rounded-md border border-dashed border-hairline bg-canvas text-ink-faint outline-selection hover:border-transparent hover:bg-hover hover:text-ink focus-visible:line-1'

function ColorGroups({ kind, items, selected, onSelect, onAdd, onRename }: ListProps) {
  const groups = new Map<string, Token[]>()
  for (const t of items) {
    const g = groupOf(shortName(kind, t.name))
    groups.set(g, [...(groups.get(g) ?? []), t])
  }

  return (
    <div className="space-y-6">
      {[...groups].map(([group, list]) => (
        <div key={group}>
          <p className="mb-2 text-xs font-[550] text-ink-faint">{group || '단독 색'}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-3 gap-y-4">
            {list.map((t) => {
              const short = shortName(kind, t.name)
              const isSelected = selected.includes(t.name)
              const labeled = isSelected && selected.length === 1
              return (
                <button
                  key={t.name}
                  type="button"
                  data-token={t.name}
                  aria-pressed={isSelected}
                  aria-label={`${short} ${t.value}`}
                  onClick={(e) => onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
                  className="group text-left outline-none select-none"
                >
                  <span className="relative block">
                    <span
                      className={`block h-14 rounded-md border border-hairline ${isSelected ? SELECTED : ''} group-hover:line-2 group-focus-visible:line-2 ${OUTLINE}`}
                      style={{ background: t.value }}
                    />
                    {labeled && <SelectionLabel name={short} value={t.value} />}
                  </span>
                  <span>
                    <span data-name className="mt-1.5 block truncate text-xs text-ink-soft">
                      {group ? short.slice(group.length + 1) : short}
                    </span>
                    <span className="block truncate font-mono text-xs text-ink-faint">{t.value}</span>
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              aria-label={group ? `${group} 목록에 색 추가` : '단독 색 추가'}
              onClick={() => onAdd(kind, group)}
              className={`${ADD_TILE} h-14`}
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/** 네모 칸 하나에 값이 적용된 모습. */
function TileSample({ kind, value }: { kind: Kind; value: string }) {
  const BOX = 'block size-16'
  switch (kind.id) {
    case 'shadow':
      return <span className={`${BOX} rounded-md bg-white`} style={{ boxShadow: value }} />
    case 'opacity':
      return <span className={`${BOX} rounded-md bg-ink`} style={{ opacity: value }} />
    case 'blur':
      return <span className={`${BOX} rounded-full bg-ink`} style={{ filter: `blur(${value})` }} />
    case 'aspect':
      return (
        <span className="flex size-16 items-center justify-center">
          <span className="block max-h-full w-full border border-ink-soft bg-hover" style={{ aspectRatio: value }} />
        </span>
      )
    default:
      return <span className={`${BOX} border border-ink-soft bg-hover`} style={{ borderRadius: value }} />
  }
}

function TileGrid({ kind, items, selected, onSelect, onAdd, onRename }: ListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = selected.includes(t.name)
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={(e) => onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
            className={`relative flex flex-col items-center rounded-lg border border-hairline bg-canvas p-4 select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <TileSample kind={kind} value={t.value} />
            <span data-name className="mt-3 block max-w-full truncate text-xs text-ink-soft">{short}</span>
            <span className="block max-w-full truncate font-mono text-xs text-ink-faint">{t.value}</span>
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} min-h-[138px] rounded-lg`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

function RowList({ kind, items, selected, onSelect, onAdd, onRename }: ListProps) {
  return (
    <div className="space-y-0.5 rounded-lg border border-hairline bg-canvas p-1">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = selected.includes(t.name)
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={(e) => onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
            className={`group relative flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <span className="w-28 shrink-0">
              <span data-name className="block truncate text-xs text-ink-soft">{short}</span>
              <span className="block truncate font-mono text-xs text-ink-faint">{t.value}</span>
            </span>
            <span className="min-w-0 flex-1 overflow-hidden">
              <RowSample kind={kind} value={t.value} />
            </span>
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} h-10 w-full`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

/** 줄에 마우스를 올리면 오른쪽으로 움직이는 점. 움직임 값을 눈으로 확인하는 용도. */
function MovingDot({ style }: { style: CSSProperties }) {
  return (
    <span
      className="block size-3 rounded-full bg-ink transition-transform group-hover:translate-x-48"
      style={style}
    />
  )
}

function RowSample({ kind, value }: { kind: Kind; value: string }) {
  switch (kind.id) {
    case 'font':
      return <span className="block truncate text-lg" style={{ fontFamily: value }}>{SAMPLE}</span>
    case 'size':
      return <span className="block truncate leading-tight" style={{ fontSize: value }}>{SAMPLE}</span>
    case 'weight':
      return <span className="block truncate text-lg" style={{ fontWeight: value }}>{SAMPLE}</span>
    case 'leading':
      return (
        <span className="block" style={{ lineHeight: value }}>
          {SAMPLE}
          <br />
          {SAMPLE}
        </span>
      )
    case 'tracking':
      return <span className="block truncate text-lg" style={{ letterSpacing: value }}>{SAMPLE}</span>
    case 'border':
      return <span className="block w-full max-w-60 bg-ink" style={{ height: value }} />
    case 'breakpoint':
    case 'container':
      // 실제 폭은 화면에 다 담기지 않으므로 8분의 1로 줄여 서로 비교할 수 있게 한다.
      return <span className="block h-3 max-w-full rounded-xs bg-ink" style={{ width: `calc(${value} / 8)` }} />
    case 'z':
      return null
    case 'duration':
      return <MovingDot style={{ transitionDuration: value }} />
    case 'ease':
      return <MovingDot style={{ transitionDuration: '800ms', transitionTimingFunction: value }} />
    default:
      return <span className="block h-3 max-w-full rounded-xs bg-ink" style={{ width: value }} />
  }
}
