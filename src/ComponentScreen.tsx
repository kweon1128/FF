import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic'
import type { Token } from './lib/api'
import { STATES, cellLabel, cellStyle, type Cell, type Comp, type StateId } from './lib/components'
import { ADD_TILE, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'

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
  /** 종류나 크기의 이름을 더블클릭하면 그 자리에서 고친다. rect는 이름이 적힌 자리. */
  onRenameVariant: (index: number, rect: DOMRect) => void
  onRenameSize: (index: number, rect: DOMRect) => void
}) {
  const shown = cells.at(-1) ?? { v: 0, s: 0, state: 'default' as StateId }

  return (
    <div className="mx-auto max-w-[960px]">
      <h1 className="mb-4 flex h-8 items-center text-base font-[650]">{comp.name}</h1>

      <div className="flex min-h-40 items-center justify-center rounded-lg border border-hairline bg-canvas p-8">
        <LivePreview comp={comp} cell={shown} tokens={tokens} />
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        {comp.variants[shown.v]?.name} · {comp.sizes[shown.s]?.name}
      </p>

      <div className="mt-8 space-y-8">
        {comp.variants.map((variant, v) => (
          <section key={v}>
            <h2 className="mb-2 text-xs font-[550] text-ink-faint">
              <span data-variant-name={v} onDoubleClick={(e) => onRenameVariant(v, e.currentTarget.getBoundingClientRect())}>
                {variant.name}
              </span>
            </h2>
            <div className="space-y-3">
              {comp.sizes.map((size, s) => (
                <div key={s} className="flex items-start gap-3">
                  <span className="flex h-24 w-12 shrink-0 items-center text-xs text-ink-soft">
                    <span className="truncate" onDoubleClick={(e) => onRenameSize(s, e.currentTarget.getBoundingClientRect())}>
                      {size.name}
                    </span>
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-4 gap-3">
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
                            className={`relative flex h-24 items-center justify-center rounded-lg border border-hairline bg-canvas p-3 ${isSelected ? SELECTED : ''} group-hover:line-2 group-focus-visible:line-2 ${OUTLINE}`}
                          >
                            <span className="pointer-events-none flex max-w-full overflow-hidden">
                              <CompPreview comp={comp} cell={here} tokens={tokens} />
                            </span>
                            {labeled && <SelectionLabel name={cellLabel(comp, here)} />}
                          </span>
                          <span className="mt-1 block truncate text-xs text-ink-faint">
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="w-12 shrink-0" />
                <button type="button" aria-label="크기 추가" onClick={onAddSize} className={`${ADD_TILE} h-10 flex-1`}>
                  <Plus size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </section>
        ))}

        <button
          type="button"
          aria-label="종류 추가"
          onClick={onAddVariant}
          className={`${ADD_TILE} h-24 w-full rounded-lg`}
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
