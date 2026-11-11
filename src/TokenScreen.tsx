import { Plus } from 'lucide-react'
import type { Token } from './lib/api'
import { groupOf, shortName, type Kind } from './lib/catalog'
import { Button, EmptyState } from './ui'

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 Aa 123'

export type SectionProps = {
  tokens: Token[]
  selected: string | null
  onSelect: (name: string) => void
  /** group은 색에서만 쓴다. ''는 목록에 속하지 않은 단독 색. */
  onAdd: (kind: Kind, group?: string) => void
  onAddGroup: () => void
}

/** 기본 값 화면 하나(색상, 글꼴, 간격, 모서리). */
export function TokenScreen({ title, kinds, ...rest }: SectionProps & { title: string; kinds: Kind[] }) {
  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-4 flex h-8 items-center justify-between">
        <h1 className="text-base font-[650]">{title}</h1>
        {kinds[0].id === 'color' && <AddGroupButton onAddGroup={rest.onAddGroup} />}
      </div>
      <KindSections kinds={kinds} {...rest} />
    </div>
  )
}

/** 한 화면에 속한 종류들을 차례로 그린다. 전체 보기의 판 안에서도 그대로 쓴다. */
export function KindSections({ kinds, tokens, selected, onSelect, onAdd, onAddGroup }: SectionProps & { kinds: Kind[] }) {
  const single = kinds.length === 1
  return (
    <div className="space-y-8">
      {kinds.map((kind) => {
        const items = tokens.filter((t) => kind.matches(t.name))
        const list = { kind, items, selected, onSelect, onAdd }
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
            ) : kind.id === 'radius' ? (
              <RadiusGrid {...list} />
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
  selected: string | null
  onSelect: (name: string) => void
  onAdd: (kind: Kind, group?: string) => void
}

const HANDLE = 'pointer-events-none absolute z-10 size-[7px] border border-selection bg-white'

/** 선택한 항목에 붙는 표시: 네 꼭짓점의 작은 사각형과 아래의 파란 이름표(이름 · 값). */
function SelectionLabel({ name, value }: { name: string; value: string }) {
  return (
    <>
      <span className={`${HANDLE} -top-[3px] -left-[3px]`} />
      <span className={`${HANDLE} -top-[3px] -right-[3px]`} />
      <span className={`${HANDLE} -bottom-[3px] -left-[3px]`} />
      <span className={`${HANDLE} -right-[3px] -bottom-[3px]`} />
      <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 rounded-xs bg-selection px-1 text-xs leading-[18px] font-[550] whitespace-nowrap text-white">
        {name} · {value}
      </span>
    </>
  )
}

// 선택과 호버 표시. 선은 항목의 가장자리에 틈 없이 붙는다(안쪽으로 1px 겹쳐 원래 테두리를 덮는다).
// 피그마와 같게: 마우스를 올리면 2px 선, 선택하면 1px 선에 꼭짓점 사각형과 이름표가 붙는다.
// 선택된 항목도 마우스를 올리면 선이 2px로 두꺼워진다.
const OUTLINE = '-outline-offset-1 outline-selection'
const SELECTED = 'outline-1'
const HOVER = 'hover:outline-2 focus-visible:outline-2'

const ADD_TILE =
  'flex items-center justify-center rounded-md border border-dashed border-hairline bg-canvas text-ink-faint outline-selection hover:border-ink-faint hover:text-ink focus-visible:outline-1'

function ColorGroups({ kind, items, selected, onSelect, onAdd }: ListProps) {
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
              const isSelected = t.name === selected
              return (
                <button
                  key={t.name}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${short} ${t.value}`}
                  onClick={() => onSelect(t.name)}
                  className="group text-left outline-none"
                >
                  <span className="relative block">
                    <span
                      className={`block h-14 rounded-md border border-hairline ${isSelected ? SELECTED : ''} group-hover:outline-2 group-focus-visible:outline-2 ${OUTLINE}`}
                      style={{ background: t.value }}
                    />
                    {isSelected && <SelectionLabel name={short} value={t.value} />}
                  </span>
                  <span className={isSelected ? 'invisible' : ''}>
                    <span className="mt-1.5 block truncate text-xs text-ink-soft">
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

function RadiusGrid({ kind, items, selected, onSelect, onAdd }: ListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = t.name === selected
        return (
          <button
            key={t.name}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={() => onSelect(t.name)}
            className={`relative flex flex-col items-center rounded-lg border border-hairline bg-canvas p-4 ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <span className="block size-16 border border-ink-soft bg-hover" style={{ borderRadius: t.value }} />
            <span className="mt-3 block max-w-full truncate text-xs text-ink-soft">{short}</span>
            <span className="block max-w-full truncate font-mono text-xs text-ink-faint">{t.value}</span>
            {isSelected && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} min-h-[138px] rounded-lg`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

function RowList({ kind, items, selected, onSelect, onAdd }: ListProps) {
  return (
    <div className="space-y-0.5 rounded-lg border border-hairline bg-canvas p-1">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = t.name === selected
        return (
          <button
            key={t.name}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={() => onSelect(t.name)}
            className={`relative flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <span className="w-28 shrink-0">
              <span className="block truncate text-xs text-ink-soft">{short}</span>
              <span className="block truncate font-mono text-xs text-ink-faint">{t.value}</span>
            </span>
            <span className="min-w-0 flex-1 overflow-hidden">
              <RowSample kind={kind} value={t.value} />
            </span>
            {isSelected && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} h-10 w-full`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
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
    default:
      return <span className="block h-3 max-w-full rounded-xs bg-ink" style={{ width: value }} />
  }
}
