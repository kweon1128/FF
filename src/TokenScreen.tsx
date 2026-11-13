import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Plus, RotateCcw } from 'lucide-react'
import type { Token } from './lib/api'
import { groupOf, lineName, shortName, type Kind } from './lib/catalog'
import { isApprox, showColor } from './lib/color'
import { shownFont } from './lib/fonts'
import { SCALE_STEPS } from './lib/scale'
import type { RoleUse } from './lib/roles'
import { RoleList } from './Roles'
import { Button, swatchBackground } from './ui'

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 Aa 123'

export type SectionProps = {
  tokens: Token[]
  /** 선택한 값의 이름들. Shift를 누른 채 누르면 여러 개가 담긴다. */
  selected: string[]
  /** additive가 참이면 지금 선택에 더하거나 뺀다. */
  onSelect: (name: string, additive: boolean) => void
  /** group은 색에서만 쓴다. ''는 단계 목록에 속하지 않은 예외 색. */
  onAdd: (kind: Kind, group?: string) => void
  onAddGroup: () => void
  /** 항목을 더블클릭하면 그 자리에서 이름을 고친다. */
  onRename: (name: string) => void
  /** 색 목록의 이름을 누르면 그 목록의 색을 모두 선택한다. rename이면 이어서 목록 이름을 고치러 간다. */
  onSelectGroup: (names: string[], additive: boolean, rename: boolean) => void
  /** 색을 모두 지웠지만 남겨 둔 빈 색 목록들. */
  emptyGroups: string[]
  /** 빈 목록은 색이 없어서 목록 자체를 선택한다. 선택한 빈 목록의 이름(없으면 null). Delete로 지운다. */
  pickedGroup: string | null
  onPickGroup: (group: string) => void
  /** 색 목록을 끌어서 다른 자리에 놓는다. before는 그 앞에 놓일 목록(맨 끝이면 null). */
  onReorderGroup: (group: string, before: string | null) => void
  /** 색상 판을 접었는지. 접으면 색 견본 아래의 이름과 값 글자를 모두 숨기고 색만 보여 준다. */
  folded: boolean
  /** 의미 색 판을 접었는지. 접으면 설명과 예시를 숨기고 색과 이름만 보여 준다. */
  rolesFolded: boolean
  /** 의미 색을 끌어서 같은 묶음 안의 다른 자리에 놓는다. before는 그 앞에 놓일 색(묶음의 맨 끝이면 null). */
  onMoveRole: (name: string, before: string | null) => void
  /** 의미 색의 역할 묶음을 끌어서 다른 자리에 놓는다. */
  onMoveRoleGroup: (use: RoleUse, before: RoleUse | null) => void
}

/** Shift, Ctrl, Cmd 중 하나를 누른 채 누르면 여러 개 선택이다. */
export const isAdditive = (e: MouseEvent) => e.shiftKey || e.ctrlKey || e.metaKey

/** 한 화면에 속한 종류들을 차례로 그린다. 전체 보기의 판 안에서도 그대로 쓴다. */
export function KindSections({ kinds, tokens, selected, onSelect, onAdd, onAddGroup, onRename, onSelectGroup, emptyGroups, pickedGroup, onPickGroup, folded, onReorderGroup, rolesFolded, onMoveRole, onMoveRoleGroup }: SectionProps & { kinds: Kind[] }) {
  const single = kinds.length === 1
  return (
    <div className="space-y-8">
      {kinds.map((kind) => {
        const items = tokens.filter((t) => kind.matches(t.name))
        const list = { kind, items, selected, onSelect, onAdd, onRename }
        // 이제 쓰지 않는 종류(따로 떨어진 줄 높이)는 파일에 값이 남아 있을 때만 보여 준다.
        if (kind.legacy && items.length === 0) return null
        // 글자 크기의 줄에는 묶인 줄 높이를 함께 보여 준다.
        const lineOf = kind.id === 'size' ? (name: string) => tokens.find((t) => t.name === lineName(name))?.value : undefined
        return (
          <section key={kind.id}>
            {!single && <h2 className="mb-2 font-[650]">{kind.title}</h2>}
            {kind.id === 'color' ? (
              // 색이 하나도 없어도 "예외 색" 목록은 처음부터 있다. 목록은 판 오른쪽 위의 "목록 추가"로 만든다.
              <ColorGroups {...list} onSelectGroup={onSelectGroup} emptyGroups={emptyGroups} pickedGroup={pickedGroup} onPickGroup={onPickGroup} folded={folded} onReorderGroup={onReorderGroup} onAddGroup={onAddGroup} />
            ) : kind.id === 'role' ? (
              <RoleList {...list} all={tokens} folded={rolesFolded} onSelectGroup={onSelectGroup} onMove={onMoveRole} onMoveGroup={onMoveRoleGroup} />
            ) : kind.tiles ? (
              <TileGrid {...list} />
            ) : (
              <RowList {...list} lineOf={lineOf} />
            )}
          </section>
        )
      })}
    </div>
  )
}

/** 판을 접고 펴는 버튼. 판 오른쪽 위에 둔다. */
export function FoldButton({ folded, title, onToggle }: { folded: boolean; title: string; onToggle: () => void }) {
  return (
    <Button variant="ghost" aria-pressed={folded} title={title} onClick={onToggle}>
      {folded ? <ChevronsUpDown size={16} strokeWidth={1.5} /> : <ChevronsDownUp size={16} strokeWidth={1.5} />}
      {folded ? '펼치기' : '접기'}
    </Button>
  )
}

/** 판 안의 순서를 기본으로 돌려놓는 버튼. 이미 기본 순서면(onReset이 없으면) 누를 수 없다. */
export function ResetButton({ title, onReset }: { title: string; onReset?: () => void }) {
  return (
    <Button variant="ghost" title={title} disabled={!onReset} onClick={onReset}>
      <RotateCcw size={16} strokeWidth={1.5} />
      원래대로
    </Button>
  )
}

/** 색상 판의 버튼들. 순서 원래대로, 글자 접기, 목록 추가. */
export function AddColorButtons({
  onAddGroup,
  folded,
  onToggleFold,
  reset,
}: {
  onAddGroup: () => void
  /** 색상 판을 접었는지. onToggleFold가 있을 때만 접기 버튼을 보여 준다. */
  folded?: boolean
  onToggleFold?: () => void
  /** 순서를 기본으로 돌려놓는다. show가 참일 때만 버튼을 보여 주고, run이 없으면 이미 기본 순서라 누를 수 없다. */
  reset?: { run?: () => void }
}) {
  return (
    <span className="flex gap-2">
      {reset && <ResetButton title="목록과 그 안의 색을 기본 순서로 돌려놓아요" onReset={reset.run} />}
      {onToggleFold && <FoldButton folded={!!folded} title="색 아래의 이름과 값 글자를 모두 숨기거나 보여요" onToggle={onToggleFold} />}
      <Button onClick={onAddGroup}>
        <Plus size={16} strokeWidth={1.5} />
        목록 추가
      </Button>
    </span>
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

// 항목을 추가하는 상자. 점선 테두리 안에 + 아이콘만 둔다. 마우스를 올리면 점선이 사라지고 옅은 회색 바탕이 된다.
export const ADD_TILE =
  'flex items-center justify-center rounded-md dash-box bg-canvas text-ink-faint outline-selection [--edge:0px] hover:bg-hover hover:bg-none hover:text-ink focus-visible:line-1'
/** 모서리가 8px인 항목(네모 칸 격자, 컴포넌트의 종류) 옆에 놓는 추가 상자. */
export const ADD_TILE_LG = ADD_TILE.replace('rounded-md dash-box', 'rounded-lg dash-box-lg')

function ColorGroups({
  kind,
  items,
  selected,
  onSelect,
  onAdd,
  onRename,
  onSelectGroup,
  emptyGroups,
  pickedGroup,
  onPickGroup,
  folded,
  onReorderGroup,
  onAddGroup,
}: ListProps &
  Pick<SectionProps, 'onSelectGroup' | 'emptyGroups' | 'pickedGroup' | 'onPickGroup' | 'folded' | 'onReorderGroup' | 'onAddGroup'>) {
  const groups = new Map<string, Token[]>()
  for (const t of items) {
    const g = groupOf(shortName(kind, t.name))
    groups.set(g, [...(groups.get(g) ?? []), t])
  }
  // 색을 모두 지운 목록도 빈 채로 남겨 둔다.
  for (const g of emptyGroups) if (!groups.has(g)) groups.set(g, [])
  // 예외 색(단계 목록에 속하지 않는 white, black 같은 색)의 목록은 색이 없어도 항상 있고, 언제나 맨 아래에 놓인다.
  const exceptions = groups.get('') ?? []
  groups.delete('')
  groups.set('', exceptions)

  // 목록 이름을 잡고 위아래로 끌면 목록의 순서가 바뀐다. 색이 있는 목록만 옮길 수 있다(빈 목록은 파일에 자리가 없다).
  // 예외 색 목록은 항상 맨 아래라 옮기지 않는다.
  const movable = [...groups].filter(([g, list]) => g && list.length > 0).map(([g]) => g)
  const drag = useRef<{ group: string; y: number; moved: boolean } | null>(null)
  // 끌기가 끝난 직후에 따라오는 클릭은 목록 선택으로 치지 않는다.
  const dragged = useRef(false)
  // 끄는 중에 놓일 자리. before 앞에 놓인다(맨 끝이면 null).
  const [drop, setDrop] = useState<{ group: string; before: string | null } | null>(null)

  /** 마우스 높이에서 놓으면 어느 목록 앞에 들어가는지. 목록의 세로 한가운데보다 위면 그 목록 앞이다. */
  function slotAt(clientY: number): string | null {
    for (const g of movable) {
      const box = document.querySelector(`[data-color-group="${CSS.escape(g)}"]`)?.getBoundingClientRect()
      if (box && clientY < box.top + box.height / 2) return g
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/*
        목록이 아직 하나도 없으면 "primary"라는 본보기 목록을 흐리게 보여 준다. 예외 색 목록만 덩그러니 있으면 무엇을 하는 곳인지 알기 어렵다.
        실제 값이 아니라 자리 표시다. 누르면 목록 추가 창이 열린다.
      */}
      {groups.size === 1 && (
        <button type="button" aria-label="목록 추가" onClick={onAddGroup} className="group block w-full text-left outline-selection focus-visible:outline-2">
          <span className="mb-2 block text-base font-[650] text-ink-faint">primary</span>
          <span className={`grid grid-cols-12 gap-x-3 ${folded ? 'gap-y-3' : 'gap-y-4'}`}>
            {SCALE_STEPS.map((step) => (
              <span key={step}>
                {/* 추가 칸과 같은 점선 상자. */}
                <span className="block h-16 rounded-md dash-box bg-canvas group-hover:bg-hover group-hover:bg-none" />
                {!folded && <span className="mt-1.5 block text-sm text-ink-faint">{step}</span>}
              </span>
            ))}
          </span>
        </button>
      )}
      {[...groups].map(([group, list]) => (
        <div key={group} data-color-group={group} className={`relative ${drop?.group === group ? 'opacity-40' : ''}`}>
          {/* 끄는 중에 놓일 자리를 알려 주는 선. 이 목록 앞에 놓이면 위에, 맨 끝에 놓이면 마지막 목록 아래에 긋는다. */}
          {drop && drop.before === group && drop.group !== group && (
            <span className="pointer-events-none absolute inset-x-0 -top-3 h-[calc(var(--line)*2)] -translate-y-1/2 bg-selection" />
          )}
          {drop && drop.before === null && movable.at(-1) === group && drop.group !== group && (
            <span className="pointer-events-none absolute inset-x-0 -bottom-3 h-[calc(var(--line)*2)] translate-y-1/2 bg-selection" />
          )}
          {/* 영문 목록 이름은 소문자라 작아 보여서 16px, 한글인 '예외 색'은 다른 제목과 같은 14px. */}
          {/* 목록 이름을 누르면 그 목록의 색이 모두 선택되고, 더블클릭하면 오른쪽 패널의 목록 이름 칸으로 간다. */}
          {/* 색이 없는 빈 목록은 이름 자체가 선택되고(파란 선), 그 상태에서 Delete를 누르면 목록이 지워진다. */}
          <div className="mb-2 -ml-1 flex items-center gap-1">
          <button
            type="button"
            data-group-name={group}
            aria-pressed={list.length === 0 ? pickedGroup === group : undefined}
            onClick={(e) => {
              if (dragged.current) return
              // 예외 색 목록은 비어 있어도 지울 수 없으므로 선택하지 않는다.
              if (list.length === 0) group && onPickGroup(group)
              else onSelectGroup(list.map((t) => t.name), isAdditive(e), false)
            }}
            // 이름을 잡고 끌면 목록이 옮겨진다. 캔버스가 이 끌기를 영역 선택으로 받지 않게 막는다.
            onPointerDown={(e) => {
              if (e.button !== 0 || list.length === 0 || !group) return
              e.stopPropagation()
              // 누르는 순간부터 마우스를 붙잡아 둔다. 빠르게 끌어 이름 밖으로 나가도 계속 따라갈 수 있다.
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { group, y: e.clientY, moved: false }
            }}
            onPointerMove={(e) => {
              const d = drag.current
              if (!d) return
              if (!d.moved) {
                if (Math.abs(e.clientY - d.y) < 5) return
                d.moved = true
              }
              setDrop({ group: d.group, before: slotAt(e.clientY) })
            }}
            onPointerUp={(e) => {
              const d = drag.current
              drag.current = null
              setDrop(null)
              if (!d?.moved) return
              dragged.current = true
              window.setTimeout(() => (dragged.current = false))
              onReorderGroup(d.group, slotAt(e.clientY))
            }}
            onPointerCancel={() => {
              drag.current = null
              setDrop(null)
            }}
            onDoubleClick={() => list.length > 0 && onSelectGroup(list.map((t) => t.name), false, true)}
            className={`rounded-sm px-1 font-[650] outline-selection hover:bg-hover focus-visible:outline-2 ${group ? 'text-base' : ''} ${
              list.length === 0 && pickedGroup === group ? 'line-1' : ''
            }`}
            style={{ '--edge': '0px' } as CSSProperties}
          >
            {group || '예외 색'}
          </button>
          </div>
          {/* 한 줄에 12칸. 50부터 950까지 11단계인 한 목록과 추가 칸이 한 줄에 들어간다. 접으면 글자가 없어지므로 줄 사이를 좁힌다. */}
          <div className={`grid grid-cols-12 gap-x-3 ${folded ? 'gap-y-3' : 'gap-y-4'}`}>
            {list.map((t, i) => {
              const short = shortName(kind, t.name)
              const isSelected = selected.includes(t.name)
              const labeled = isSelected && selected.length === 1
              // 파일에는 oklch로 적혀 있어도 화면에는 읽기 쉬운 #으로 보여 준다.
              const shown = showColor(t.value)
              // 화면이 낼 수 없는 선명한 색이면 #은 가까운 색일 뿐이라는 표시를 붙인다.
              const approx = isApprox(t.value)
              return (
                <button
                  key={t.name}
                  type="button"
                  data-token={t.name}
                  aria-pressed={isSelected}
                  aria-label={`${short} ${shown}`}
                  onClick={(e) => onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
                  // 색은 한 줄에 11개까지. 12번째 칸은 추가 칸의 자리라서, 12번째 색부터는 다음 줄 맨 앞에서 시작한다.
                  className={`group text-left outline-none select-none ${i > 0 && i % 11 === 0 ? 'col-start-1' : ''}`}
                >
                  <span className="relative block">
                    <span
                      className={`block h-16 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] ${isSelected ? SELECTED : ''} group-hover:line-2 group-focus-visible:line-2 ${OUTLINE}`}
                      // 옅은 선은 색 면의 안쪽에 그린다(바깥으로 삐져나오지 않는다). 테두리가 없으므로 선택 선도 면의 가장자리에 딱 맞춘다.
                      style={{ background: swatchBackground(t.value), '--edge': '0px' } as CSSProperties}
                    />
                    {labeled && <SelectionLabel name={short} value={shown} />}
                  </span>
                  {/* 접으면 이름과 값 글자를 숨긴다. 색을 고르면 뜨는 파란 이름표로는 여전히 볼 수 있다. */}
                  {!folded && (
                  <span>
                    <span data-name className="mt-1.5 block truncate text-sm text-ink-soft">
                      {group ? short.slice(group.length + 1) : short}
                    </span>
                    <span
                      className="block truncate font-mono text-sm text-ink-faint"
                      title={approx ? `${t.value} · 화면이 낼 수 없는 색이라 가까운 색으로 보여 줘요` : undefined}
                    >
                      {approx ? '≈ ' : ''}
                      {shown}
                    </span>
                  </span>
                  )}
                </button>
              )
            })}
            <button
              type="button"
              aria-label={group ? `${group} 목록에 색 추가` : '예외 색 추가'}
              onClick={() => onAdd(kind, group)}
              className={`${ADD_TILE} h-16`}
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
            <span data-name className="mt-3 block max-w-full truncate text-sm text-ink-soft">{short}</span>
            <span className="block max-w-full truncate font-mono text-sm text-ink-faint">{t.value}</span>
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE_LG} min-h-[138px]`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

function RowList({ kind, items, selected, onSelect, onAdd, onRename, lineOf }: ListProps & { lineOf?: (name: string) => string | undefined }) {
  // 값이 긴 종류는 이름·값과 견본을 위아래로 쌓는다.
  const stacked = kind.id === 'font'
  return (
    <div className="space-y-0.5 rounded-lg border border-hairline bg-canvas p-1">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = selected.includes(t.name)
        const line = lineOf?.(t.name)
        // 글자 크기는 줄 높이와 한 쌍으로 적는다(14px / 20px).
        // 글꼴 종류는 대체 글꼴을 뺀 글꼴 이름만 적는다.
        const shown = stacked ? shownFont(t.value) : line ? `${t.value} / ${line}` : t.value
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${shown}`}
            onClick={(e) => onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
            className={`group relative w-full rounded-md px-3 py-2.5 text-left select-none ${stacked ? 'block' : 'flex items-center gap-4'} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {stacked ? (
              // 글꼴 종류는 이름과 글꼴 이름을 한 줄 전체에 쓰고, 견본은 그 아래에 둔다. 글꼴 이름은 좁은 칸에 넣으면 잘린다.
              <>
                <span data-name className="block text-sm text-ink-soft">{short}</span>
                {/* 다른 줄의 값(14px)보다 작게 12px로 적어 견본 문장이 주인공이 되게 한다. */}
                <span className="block font-mono text-xs leading-4 break-words text-ink-faint">{shown}</span>
                <span className="mt-2 block overflow-hidden">
                  <RowSample kind={kind} value={t.value} />
                </span>
              </>
            ) : (
              <>
                <span className="w-28 shrink-0">
                  <span data-name className="block truncate text-sm text-ink-soft">{short}</span>
                  <span className="block truncate font-mono text-sm text-ink-faint">{shown}</span>
                </span>
                <span className="min-w-0 flex-1 overflow-hidden">
                  <RowSample kind={kind} value={t.value} line={line} />
                </span>
              </>
            )}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={shown} />}
          </button>
        )
      })}
      {!kind.legacy && (
        <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} h-10 w-full`}>
          <Plus size={16} strokeWidth={1.5} />
        </button>
      )}
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

function RowSample({ kind, value, line }: { kind: Kind; value: string; line?: string }) {
  switch (kind.id) {
    case 'font':
      return <span className="block truncate text-lg" style={{ fontFamily: value }}>{SAMPLE}</span>
    case 'size':
      // 줄 높이가 묶여 있으면 두 줄로 써서 줄 사이가 보이게 한다. 줄 높이는 한 줄로는 보이지 않는다.
      return line ? (
        <span className="block" style={{ fontSize: value, lineHeight: line }}>
          <span className="block truncate">{SAMPLE}</span>
          <span className="block truncate">{SAMPLE}</span>
        </span>
      ) : (
        <span className="block truncate leading-tight" style={{ fontSize: value }}>{SAMPLE}</span>
      )
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
