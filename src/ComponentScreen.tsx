import { ICON_STROKE } from './lib/icons'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic'
import type { Token } from './lib/api'
import { STATES, cellLabel, cellStyle, type Cell, type Comp, type StateId } from './lib/components'
import { OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button } from './ui'

export const isIconName = (name: string | undefined): name is IconName =>
  !!name && (iconNames as string[]).includes(name)

/** 사용자의 컴포넌트를 한 칸(종류 · 크기 · 상태)의 모습으로 그린다. 이 안은 사용자의 값만 따른다. */
function CompPreview({ comp, cell, tokens }: { comp: Comp; cell: Cell; tokens: Token[] }) {
  const icon =
    comp.iconPos !== 'none' && isIconName(comp.icon) ? <DynamicIcon name={comp.icon} size="1em" /> : null
  return (
    <span style={cellStyle(comp, cell, tokens)}>
      {comp.iconPos === 'before' && icon}
      {comp.label}
      {comp.iconPos === 'after' && icon}
    </span>
  )
}

/** 큰 미리보기. 실제로 마우스를 올리거나 누르면 그 상태의 모습으로 바뀐다. */
function LivePreview({ comp, cell, tokens }: { comp: Comp; cell: Cell; tokens: Token[] }) {
  const [live, setLive] = useState<StateId>('default')
  return (
    <span
      className="inline-flex cursor-pointer select-none"
      onPointerEnter={() => setLive('hover')}
      onPointerLeave={() => setLive('default')}
      onPointerDown={() => setLive('pressed')}
      onPointerUp={() => setLive('hover')}
    >
      <CompPreview comp={comp} cell={{ ...cell, state: live }} tokens={tokens} />
    </span>
  )
}

export function ComponentScreen({
  comp,
  tokens,
  cells,
  onSelect,
  onAddVariant,
  onAddSize,
  onRenameVariant,
  onRenameSize,
}: {
  comp: Comp
  tokens: Token[]
  /** 선택한 칸들. Shift를 누른 채 누르면 여러 개가 담긴다. 마지막 칸이 큰 미리보기에 보인다. */
  cells: Cell[]
  onSelect: (cell: Cell, additive: boolean) => void
  onAddVariant: () => void
  onAddSize: () => void
  /** 종류나 크기의 이름을 더블클릭하면 오른쪽 패널의 이름 칸으로 간다. */
  onRenameVariant: (index: number) => void
  onRenameSize: (index: number) => void
}) {
  const shown = cells.at(-1) ?? { v: 0, s: 0, state: 'default' as StateId }

  return (
    <div className="mx-auto max-w-(--width-page)">
      {/* 이름 줄. 종류와 크기를 추가하는 버튼은 격자 끝의 점선 상자가 아니라 여기에 둔다. 크기는 모든 종류가 함께 쓰므로 종류마다 두지 않는다. */}
      <div className="mb-header flex h-control items-center justify-between">
        <h1 className="type-title">{comp.name}</h1>
        <span className="flex gap-actions-tight">
          <Button variant="ghost" onClick={onAddVariant}>
            <Plus size={16} strokeWidth={ICON_STROKE} />
            종류 추가
          </Button>
          <Button variant="ghost" onClick={onAddSize}>
            <Plus size={16} strokeWidth={ICON_STROKE} />
            크기 추가
          </Button>
        </span>
      </div>

      <div className="flex min-h-[160px] items-center justify-center rounded-float border-edge border-hairline bg-canvas p-board">
        <LivePreview comp={comp} cell={shown} tokens={tokens} />
      </div>
      <p className="mt-label type-caption text-ink-faint">
        {comp.variants[shown.v]?.name} · {comp.sizes[shown.s]?.name}
      </p>

      <div className="mt-groups space-y-groups">
        {comp.variants.map((variant, v) => (
          <section key={v}>
            <h2 className="mb-heading type-caption-strong text-ink-faint">
              <span data-variant-name={v} onDoubleClick={() => onRenameVariant(v)}>
                {variant.name}
              </span>
            </h2>
            <div className="space-y-cells">
              {comp.sizes.map((size, s) => (
                <div key={s} className="flex items-start gap-cells">
                  <span className="flex h-[96px] w-[48px] shrink-0 items-center type-caption text-ink-soft">
                    <span className="truncate" onDoubleClick={() => onRenameSize(s)}>
                      {size.name}
                    </span>
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-4 gap-cells">
                    {STATES.map(({ id, label }) => {
                      const here = { v, s, state: id }
                      const isSelected = cells.some((c) => c.v === v && c.s === s && c.state === id)
                      const labeled = isSelected && cells.length === 1
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={cellLabel(comp, here)}
                          data-cell
                          onClick={(e) => onSelect(here, isAdditive(e))}
                          className="group min-w-0 text-left outline-none select-none"
                        >
                          <span
                            className={`relative flex h-[96px] items-center justify-center rounded-float border-edge border-hairline bg-canvas p-card ${isSelected ? SELECTED : ''} group-hover:line-2 group-focus-visible:line-2 ${OUTLINE}`}
                          >
                            <span className="pointer-events-none flex max-w-full overflow-hidden">
                              <CompPreview comp={comp} cell={here} tokens={tokens} />
                            </span>
                            {labeled && <SelectionLabel name={cellLabel(comp, here)} />}
                          </span>
                          <span className="mt-label block truncate type-caption text-ink-faint">
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
