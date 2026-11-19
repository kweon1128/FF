// 겹치는 차례 판의 내용과 예시, 패널, 추가 창.
// 의미 모서리 판과 같은 짜임이다. 묶음마다 한 줄에 값 하나, 왼쪽에 이름·차례·설명, 오른쪽에 그것이 무엇 위에 놓이는지를 보여 주는 예시.

import { useContext, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Check as CheckIcon, ChevronDown, Folder, Minus, Plus } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, shortName, type Kind } from './lib/catalog'
import { ICON_STROKE } from './lib/icons'
import { LAYER_GROUPS, LAYER_WORDS, guessLayerGroup, layerNumber, readLayerNote, writeLayerNote, type LayerExample, type LayerGroup, type LayerShape } from './lib/layers'
import { SAMPLE_BAR, sampleColors, type SampleColors } from './lib/sample'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass , linkRowClass } from './ui'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/** 떠 있는 것에 드리울 그림자. 보여 주는 시스템의 값이다(없으면 드리우지 않는다). */
export type LayerShadows = { float?: string; dialog?: string }

/**
 * 그것이 무엇 위에 놓이는지를 보여 주는 그림. 겹치는 차례는 숫자라서 그 자체로는 보이지 않는다. 그래서 그 차례를 쓰는 요소를, 그것이 덮는 것과 함께 그린다.
 * 창은 가려진 화면 위에, 고르는 목록은 창 위에, 이름표는 이웃한 줄 위에 놓인다. 주인공(창, 목록, 이름표)은 실제 모습으로 그리고, 그 아래에 깔리는 화면만 옅은 막대로 자리를 알린다.
 * 색은 이 디자인 시스템의 것이다. 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다.
 */
export function LayerSample({ shape, value, colors: c, shadows, words: written = '' }: { shape: LayerShape; value: string; colors: SampleColors; shadows: LayerShadows; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const list = (written || LAYER_WORDS[shape]).split(', ').map((w) => w.trim())
  // 주인공에는 그 값의 차례를 실제로 넣는다. 예시 상자가 따로 한 겹(isolate)이라, 그 숫자는 상자 안에서만 견주어지고 판의 다른 것 위로 올라오지 않는다.
  const z = Number.isNaN(layerNumber(value)) ? undefined : layerNumber(value)
  const TEXT = 'text-sm leading-5'
  const SMALL = 'text-xs leading-4'
  const STRONG = 'text-sm leading-5 font-[550]'
  const ring = { boxShadow: `inset 0 0 0 1px ${c.line}` }
  const lifted = (shadow?: string): CSSProperties => ({ background: c.surface, boxShadow: [`inset 0 0 0 1px ${c.line}`, shadow].filter(Boolean).join(', ') })
  const bar = (width: string) => <span className={`block ${SAMPLE_BAR} rounded-small ${width}`} style={{ background: c.filler }} />
  /** 아래에 깔리는 화면. 무엇이 적혀 있는지는 중요하지 않아서 막대로 자리만 알린다. */
  const page = (
    <span className="absolute inset-0 block space-y-blocks p-sample">
      {bar('w-1/3')}
      {bar('w-2/3')}
      {bar('w-1/2')}
      {bar('w-3/4')}
      {bar('w-2/5')}
      {bar('w-3/5')}
    </span>
  )
  /** 예시 상자. 겹쳐 놓는 그림이라 높이를 정해 두고 그 안에 자리를 잡아 놓는다. */
  const frame = (height: string, body: ReactNode) => (
    <span className={`relative isolate block w-full overflow-hidden rounded-card ${height} ${EDGE}`} style={{ ...space, background: c.surface, color: c.ink, fontFamily: font }}>
      {body}
    </span>
  )
  /** 창. 문구는 제목, 입력칸의 이름표, 아래 버튼들의 차례다. body를 주면 이름표 아래의 입력칸 자리에 그것을 놓는다. */
  const dialog = (words: string[], body?: ReactNode, more = '', main = false) => {
    const [title, label, ...actions] = words
    return (
      <span {...(main ? { 'data-sample': true } : {})} className={`block w-[224px] rounded-float p-dialog ${more}`} style={{ ...lifted(shadows.dialog), ...(main ? { zIndex: z } : {}) }}>
        <span className="mb-header block text-base leading-6 font-[650] break-words">{title}</span>
        {label && (
          <span className={`mb-label block ${STRONG}`} style={{ color: c.faint }}>
            {label}
          </span>
        )}
        {body ?? <span className="block h-control rounded-control" style={ring} />}
        {actions.length > 0 && (
          <span className="mt-dialog-actions flex justify-end gap-actions">
            {actions.map((text, i) => (
              <span
                key={i}
                className={`flex h-control items-center rounded-control whitespace-nowrap ${i === actions.length - 1 ? 'px-button-x' : 'px-button-ghost-x'} ${STRONG}`}
                style={i === actions.length - 1 ? { background: c.primary, color: c.onPrimary } : { color: c.soft }}
              >
                {text}
              </span>
            ))}
          </span>
        )}
      </span>
    )
  }
  /** 값을 늘어놓은 목록 상자(판 안의 줄들). pick번째 줄이 고른 줄이다. */
  const rows = (names: string[], extra?: (i: number) => ReactNode, picked = 0) => (
    <span className="block w-[200px] space-y-rows rounded-float p-menu" style={ring}>
      {names.map((text, i) => (
        <span key={i} className={`relative block rounded-row px-board-row-x py-board-row-y whitespace-nowrap ${STRONG}`} style={i === picked ? { boxShadow: `inset 0 0 0 1px ${c.selection}` } : undefined}>
          {text}
          {extra?.(i)}
        </span>
      ))}
    </span>
  )
  const handle = 'absolute block size-[7px]'
  const knob = { background: c.surface, boxShadow: `inset 0 0 0 1px ${c.selection}` }
  const handles = (main: boolean) => (
    <>
      <span {...(main ? { 'data-sample': true } : {})} className={`${handle} -top-[3px] -left-[3px]`} style={{ ...knob, ...(main ? { zIndex: z } : {}) }} />
      <span className={`${handle} -top-[3px] -right-[3px]`} style={knob} />
      <span className={`${handle} -bottom-[3px] -left-[3px]`} style={knob} />
      <span className={`${handle} -right-[3px] -bottom-[3px]`} style={knob} />
    </>
  )
  /** 캔버스에 놓인 판 하나. 위에 판의 제목이 있고 그 아래는 자리만 알린다. */
  const board = (title: string, more = '') => (
    <span className={`absolute block w-[96px] rounded-float p-box ${more}`} style={{ background: c.surface, ...ring }}>
      <span className={`mb-blocks block whitespace-nowrap ${STRONG}`}>{title}</span>
      <span className="block space-y-blocks">
        {bar('w-3/4')}
        {bar('w-1/2')}
        {bar('w-2/3')}
      </span>
    </span>
  )
  /** 상단 바의 디자인 시스템 버튼과 거기서 펼쳐지는 메뉴. 첫 문구가 버튼의 말이고 나머지가 메뉴의 줄이다. catcher면 바깥을 덮는 면을 보이게 칠한다. */
  const menu = (catcher: boolean) => {
    const [current, ...items] = list
    return frame(
      'h-[176px]',
      <>
        {page}
        {catcher && <span data-sample className="absolute inset-0 block" style={{ zIndex: z, background: `color-mix(in oklab, ${c.selection} 12%, transparent)`, boxShadow: `inset 0 0 0 1px ${c.selection}` }} />}
        <span className="absolute inset-x-0 top-0 flex h-bar items-center px-bar-x" style={{ background: c.surface, boxShadow: `inset 0 -1px 0 ${c.line}` }}>
          <span className={`flex h-control items-center gap-row-inner rounded-control px-button-ghost-x whitespace-nowrap ${STRONG}`} style={{ background: c.hover }}>
            <Folder size={16} strokeWidth={ICON_STROKE} className="shrink-0" />
            {current}
            <ChevronDown size={16} strokeWidth={ICON_STROKE} className="shrink-0" style={{ color: c.faint }} />
          </span>
        </span>
        <span {...(catcher ? {} : { 'data-sample': true })} className="absolute top-[42px] left-[12px] block w-[200px] space-y-rows rounded-float p-menu" style={{ ...lifted(shadows.float), zIndex: catcher && z !== undefined ? z + 1 : z }}>
          {items.map((text, i) => (
            <span key={i} className={`flex h-row items-center gap-row-inner rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={text.startsWith('새 ') ? { color: c.soft } : undefined}>
              {text.startsWith('새 ') && <Plus size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
              <span className="min-w-0 flex-1">{text}</span>
              {text === current && <CheckIcon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
            </span>
          ))}
        </span>
      </>,
    )
  }
  switch (shape) {
    case 'dialog':
      // 화면을 가리는 막(40%)과 그 위의 창.
      return frame(
        'h-[248px]',
        <>
          {page}
          <span className="absolute inset-0 flex items-center justify-center" style={{ background: `color-mix(in oklab, ${c.scrim} 40%, transparent)` }}>
            {dialog(list, undefined, '', true)}
          </span>
        </>,
      )
    case 'toast':
      // 화면 아래 가운데에 잠깐 뜨는 알림.
      return frame(
        'h-[128px]',
        <>
          {page}
          <span data-sample className={`absolute bottom-[16px] left-1/2 flex h-control -translate-x-1/2 items-center rounded-control px-bar-x whitespace-nowrap ${TEXT}`} style={{ zIndex: z, background: c.ink, color: c.surface, boxShadow: shadows.float }}>
            {list[0]}
          </span>
        </>,
      )
    case 'popover': {
      // 창 안의 색 견본을 누르면 그 창 위에 뜨는 색 선택 창. 문구는 창의 제목, 이름표, 색 값, 아래 버튼들이다. 창에는 색 견본과 값 칸이 있고, 색 선택 창이 그 옆에서 창을 덮는다.
      const [title, label, color, ...actions] = list
      return frame(
        'h-[320px]',
        <>
          <span className="absolute inset-0 block" style={{ background: `color-mix(in oklab, ${c.scrim} 40%, transparent)` }} />
          {dialog(
            [title, label, ...actions],
            <span className="flex items-center gap-field-row">
              <span className="block size-swatch-button shrink-0 rounded-control" style={{ background: c.selection, ...ring }} />
              <span className={`flex h-control min-w-0 flex-1 items-center overflow-hidden rounded-control px-input-x font-mono whitespace-nowrap ${TEXT}`} style={ring}>
                {color}
              </span>
            </span>,
            'absolute top-[16px] left-1/2 -translate-x-1/2',
          )}
          <span data-sample className="absolute bottom-[16px] left-[16px] block w-[176px] rounded-float p-popover" style={{ ...lifted(shadows.dialog), zIndex: z }}>
            <span className="relative block h-[88px] rounded-card" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${c.selection})` }}>
              <span className="absolute top-[24px] right-[24px] block size-[16px] rounded-pill border-[4px] border-white shadow-[0_0_0_0.5px_rgb(0_0_0/0.25),0_1px_3px_rgb(0_0_0/0.35)]" style={{ background: c.selection }} />
            </span>
            <span className="mt-popover block h-[12px] rounded-pill" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
          </span>
        </>,
      )
    }
    case 'listbox':
    case 'listbackdrop': {
      // 목록 바깥 면은 목록이 열려 있는 동안 화면을 덮는 면이다. 실제로는 보이지 않고, 여기서는 어디까지 덮는지 보이도록 선택 색으로 옅게 칠한다. 창까지 덮고, 목록은 그 면보다 위다.
      const catcher = shape === 'listbackdrop'
      // 창 안의 고르는 칸에서 펼쳐진 목록. 창보다 위에 떠서 창의 아래쪽과 가장자리를 덮는다. 문구는 창의 제목, 칸의 이름표, 목록의 줄들이고, 첫 줄이 지금 고른 것이다.
      const [title, label, ...items] = list
      return frame(
        'h-[304px]',
        <>
          <span className="absolute inset-0 block" style={{ background: `color-mix(in oklab, ${c.scrim} 40%, transparent)` }} />
          {dialog(
            [title, label],
            <span className={`flex h-control items-center justify-between rounded-control px-input-x whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 0 0 1px ${c.selection}` }}>
              {items[0]}
              <ChevronDown size={16} strokeWidth={ICON_STROKE} className="shrink-0" style={{ color: c.soft }} />
            </span>,
            'absolute top-[16px] left-1/2 -translate-x-1/2',
          )}
          {catcher && <span data-sample className="absolute inset-0 block" style={{ zIndex: z, background: `color-mix(in oklab, ${c.selection} 12%, transparent)`, boxShadow: `inset 0 0 0 1px ${c.selection}` }} />}
          <span {...(catcher ? {} : { 'data-sample': true })} className="absolute top-[132px] left-1/2 block w-[176px] -translate-x-1/2 space-y-rows rounded-float p-menu" style={{ ...lifted(shadows.float), zIndex: catcher && z !== undefined ? z + 1 : z }}>
            {items.map((text, i) => (
              <span key={i} className={`flex h-row items-center rounded-row px-row-x whitespace-nowrap ${TEXT} ${i === 0 ? 'font-[550]' : ''}`} style={i === 0 ? { background: c.hover } : undefined}>
                {text}
              </span>
            ))}
          </span>
        </>,
      )
    }
    case 'menu':
      return menu(false)
    case 'backdrop':
      // 메뉴나 목록이 열려 있는 동안 화면을 덮는 면. 실제로는 보이지 않고, 바깥을 누르면 닫히게만 한다. 여기서는 어디까지 덮는지 보이도록 선택 색으로 옅게 칠한다. 메뉴는 그 면보다 위다.
      return menu(true)
    case 'handles':
      // 고른 줄의 네 꼭짓점에 붙는 사각형. 줄의 선택 선 위에 놓인다.
      return frame('h-[160px]', <span className="absolute inset-0 flex items-center justify-center">{rows(list, (i) => (i === 0 ? handles(true) : null))}</span>)
    case 'dropline':
      // 줄을 끌어 옮길 때 놓일 자리에 그어지는 선. 줄과 줄 사이에, 줄보다 위에 그어진다. 끄는 줄은 옅어진다.
      return frame(
        'h-[160px]',
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="block w-[200px] space-y-rows rounded-float p-menu" style={ring}>
            {list.map((text, i) => (
              <span key={i} className={`relative block rounded-row px-board-row-x py-board-row-y whitespace-nowrap ${STRONG}`} style={i === 0 ? { opacity: 0.4 } : undefined}>
                {text}
                {i === list.length - 1 && <span data-sample className="pointer-events-none absolute inset-x-0 -bottom-[3px] block h-[2px]" style={{ zIndex: z, background: c.selection }} />}
              </span>
            ))}
          </span>
        </span>,
      )
    case 'label': {
      // 고른 줄 아래에 붙는 이름표. 꼭짓점 사각형보다 위이고, 아래 줄을 덮는다. 첫 문구가 고른 줄이다("이름 · 값").
      const names = list.map((w, i) => (i === 0 ? w.split(' · ')[0] : w))
      return frame(
        'h-[160px]',
        <span className="absolute inset-0 flex items-center justify-center">
          {rows(names, (i) =>
            i === 0 ? (
              <>
                {handles(false)}
                <span data-sample className={`absolute top-full left-1/2 mt-blocks block -translate-x-1/2 rounded-tag px-chip-x font-[550] whitespace-nowrap ${SMALL}`} style={{ zIndex: z ?? 1, background: c.selection, color: c.onSelection }}>
                  {list[0]}
                </span>
              </>
            ) : null,
          )}
        </span>,
      )
    }
    case 'marquee':
      // 캔버스의 빈 곳에서 끌어 그리는 영역 선택 상자. 판들 위에 그려진다.
      return frame(
        'h-[176px]',
        <>
          {board(list[0] ?? '', 'top-[24px] left-[16px]')}
          {board(list[1] ?? '', 'top-[56px] left-[124px]')}
          <span data-sample className="absolute top-[12px] left-[72px] block h-[120px] w-[136px]" style={{ zIndex: z, background: `color-mix(in oklab, ${c.selection} 10%, transparent)`, boxShadow: `inset 0 0 0 1px ${c.selection}` }} />
        </>,
      )
    case 'guide': {
      // 판을 끌 때 다른 판과 맞으면 그어지는 안내선과, 판 사이의 거리. 판들 위에 그려진다. 첫 문구가 거리다.
      const [gap, ...titles] = list
      return frame(
        'h-[176px]',
        <>
          {board(titles[0] ?? '', 'top-[40px] left-[16px]')}
          {board(titles[1] ?? '', 'top-[40px] left-[136px]')}
          <span data-sample className="absolute inset-x-0 top-[40px] block h-px" style={{ zIndex: z, background: c.guide }} />
          <span className="absolute top-[88px] left-[112px] block h-px w-[24px]" style={{ background: c.guide }} />
          <span className={`absolute top-[68px] left-[124px] block -translate-x-1/2 rounded-tag px-[4px] font-[550] whitespace-nowrap tabular-nums ${SMALL}`} style={{ background: c.guide, color: c.onSelection }}>
            {gap}
          </span>
        </>,
      )
    }
    default:
      // 캔버스 오른쪽 아래에 늘 떠 있는 확대 도구. 판이 그 아래로 지나가도 가려지지 않는다. 문구는 지금의 배율이다.
      return frame(
        'h-[160px]',
        <>
          {board('', 'top-[72px] right-[-24px]')}
          <span data-sample className="absolute right-[16px] bottom-[16px] flex items-center gap-actions-tight rounded-float p-menu" style={{ ...lifted(shadows.float), zIndex: z }}>
            <span className="flex size-icon-button items-center justify-center rounded-control" style={{ color: c.soft }}>
              <Minus size={16} strokeWidth={ICON_STROKE} />
            </span>
            <span className={`flex h-control w-[56px] items-center justify-center tabular-nums ${SMALL}`}>{list[0]}</span>
            <span className="flex size-icon-button items-center justify-center rounded-control" style={{ color: c.soft }}>
              <Plus size={16} strokeWidth={ICON_STROKE} />
            </span>
          </span>
        </>,
      )
  }
}

/**
 * 겹치는 차례 판의 내용. 묶음(화면 위, 요소 위)마다 제목을 두고, 한 줄에 값 하나.
 * 왼쪽 칸(224px)에 이름, 차례의 숫자, 설명이 있고 오른쪽에 그것이 무엇 위에 놓이는지를 보여 주는 예시가 있다.
 * 줄은 숫자가 큰 것부터 놓는다. 위에 적힌 것이 화면에서도 위에 놓인다. 차례가 숫자에서 정해지므로 끌어 옮기지 않는다. 숫자가 같으면 파일에 적힌 차례다.
 */
export function LayerList({
  kind,
  items,
  all,
  selected,
  onSelect,
  onSelectGroup,
  onRename,
}: {
  kind: Kind
  items: Token[]
  /** 예시의 색과 그림자를 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 판 위의 버튼으로 한다.
  if (items.length === 0) return null
  const rows = items.map((t) => ({ t, short: shortName(kind, t.name), ...readLayerNote(t.note, shortName(kind, t.name)) }))
  const colors = sampleColors(all)
  const shadows: LayerShadows = { float: all.find((t) => t.name === '--shadow-float')?.value, dialog: all.find((t) => t.name === '--shadow-dialog')?.value }
  // 숫자로 읽을 수 없는 값(calc(), var())은 묶음의 맨 아래에 둔다.
  const order = (value: string) => (Number.isNaN(layerNumber(value)) ? -Infinity : layerNumber(value))
  return (
    <div className="space-y-groups">
      {LAYER_GROUPS.filter((g) => rows.some((r) => r.group === g.id)).map((g) => {
        const list = rows.filter((r) => r.group === g.id).sort((a, b) => order(b.t.value) - order(a.t.value))
        return (
          <div key={g.id} data-layer-group={g.id}>
            {/* 묶음의 제목. 누르면 그 묶음의 값이 모두 선택된다. 묶음의 차례는 정해져 있어서 끌어 옮기지 않는다. */}
            <button
              type="button"
              onClick={(e) => onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              className="mb-heading -ml-chip-x block rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus"
            >
              {g.label}
            </button>
            <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
              {list.map(({ t, short, text, examples }) => {
                const isSelected = selected.includes(t.name)
                // 예시는 주석에 모양이 적혀 있을 때만 그린다. 없으면 왼쪽 칸이 줄 전체를 쓴다.
                const drawn = !plain && examples.length > 0
                return (
                  <button
                    key={t.name}
                    type="button"
                    data-token={t.name}
                    aria-pressed={isSelected}
                    aria-label={`${short} ${t.value}`}
                    onClick={(e) => onSelect(t.name, isAdditive(e))}
                    onDoubleClick={() => onRename(t.name)}
                    className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
                  >
                    <span className={drawn ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
                      <span data-name className="block type-label break-words">
                        {short}
                      </span>
                      <span data-points className="block type-code-sm break-words text-ink-faint">
                        {t.value}
                      </span>
                      {!plain && text && (
                        <span data-text className="mt-label block type-caption break-words text-ink-faint">
                          <Phrases text={text} />
                        </span>
                      )}
                    </span>
                    {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
                    {drawn && (
                      <span className="block min-w-0 flex-1 space-y-blocks">
                        {examples.map((e: LayerExample, k) => (
                          <LayerSample key={k} shape={e.shape} value={t.value} colors={colors} shadows={shadows} words={e.words} />
                        ))}
                      </span>
                    )}
                    {isSelected && selected.length === 1 && <SelectionLabel name={short} value={t.value} />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const NUMBER = /^-?\d+$/

/** 이름을 쓸 수 없으면 까닭을 돌려준다. 숫자로 시작하는 이름(--z-index-10)은 숫자 클래스(z-10)와 같은 글자가 되어, 이름을 붙인 뜻이 없어진다. */
function nameProblem(kind: Kind, name: string, tokens: Token[], self?: string) {
  if (!name) return '이름을 입력해 주세요.'
  if (!SLUG.test(name)) return '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
  if (/^\d/.test(name)) return '숫자로 시작할 수 없어요.'
  if (kind.prefix + name === self) return null
  if (tokens.some((t) => t.name === kind.prefix + name)) return '같은 이름이 이미 있어요.'
  return null
}

/**
 * 겹치는 차례 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(차례), 묶음, 설명, 쓰이는 곳, 코드.
 * 차례는 적는 동안 저장하지 않고, 칸을 벗어나거나 Enter를 누를 때 저장한다. 71을 적으려면 7을 거치는데, 그 7이 저장되면 FF 자신의 값일 때 떠 있는 것이 그사이에 다른 것 아래로 내려간다.
 * 같은 숫자를 둘이 써도 된다. 서로 겹칠 일이 없는 것(화면 위의 메뉴와 요소 위의 표시)은 같은 숫자여도 문제가 없고, 겹치는 것끼리 같으면 화면에 나중에 놓인 것이 위다.
 * 예시는 여기서 고치지 않는다. 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function LayerInspector({
  token,
  kind,
  tokens,
  file,
  uses,
  onOpenComponent,
  onRename,
  onChange,
  onCopy,
}: {
  token: Token
  kind: Kind
  tokens: Token[]
  file: string
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  onRename: (next: string) => void
  /** 값(차례)이나 주석(묶음, 설명, 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  // 예전 방식의 이름(--z-10)인지. Tailwind가 읽지 않는 앞머리라 클래스가 없다.
  const classed = token.name.startsWith(kind.prefix)
  const { group, text, picked, words, more } = readLayerNote(token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [valueDraft, setValueDraft] = useState(token.value)
  const [valueError, setValueError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  // 밖에서 값이 바뀌면(되돌리기, 파일을 직접 고침) 칸을 그 값으로 다시 채운다.
  const [seen, setSeen] = useState(token.value)
  if (token.value !== seen) {
    setSeen(token.value)
    setValueDraft(token.value)
    setValueError(null)
  }

  function commitName() {
    const next = nameDraft.trim()
    const problem = nameProblem(kind, next, tokens, token.name)
    setNameError(problem)
    if (problem || next === short) return
    onRename(kind.prefix + next)
  }

  /** 칸을 벗어날 때. 비어 있으면 저장된 값으로 되돌리고, 정수가 아니면 알리고 저장하지 않는다. */
  function commitValue() {
    const next = valueDraft.trim()
    if (!next) {
      setValueDraft(token.value)
      return setValueError(null)
    }
    if (!NUMBER.test(next)) return setValueError('정수를 입력해 주세요.')
    setValueError(null)
    const value = String(Number(next))
    setValueDraft(value)
    if (value !== token.value) onChange({ value })
  }

  // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
  const saveNote = (patch: { group?: LayerGroup; text?: string }) => onChange({ note: writeLayerNote(patch.group ?? group, patch.text ?? text, picked, words, more) })

  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{short}</h2>
      </Section>

      <Section title="이름">
        <input
          className={inputClass}
          value={nameDraft}
          aria-label="이름"
          data-rename="token"
          onChange={(e) => {
            setNameDraft(e.target.value)
            setNameError(null)
          }}
          onBlur={commitName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {nameError && <span className="mt-label block type-body text-danger">{nameError}</span>}
      </Section>

      <Section title="순서">
        <input
          className={`${inputClass} ${valueError ? 'border-danger! focus:border-danger!' : ''}`}
          value={valueDraft}
          aria-label="순서"
          inputMode="numeric"
          onChange={(e) => {
            setValueDraft(e.target.value)
            setValueError(null)
          }}
          onBlur={commitValue}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {valueError && <span className="mt-label block type-body text-danger">{valueError}</span>}
      </Section>

      <Section title="묶음">
        <UsePicker label="묶음" options={LAYER_GROUPS} value={group} nameWidth="w-picker-name-wide" onChange={(next) => saveNote({ group: next })} />
      </Section>

      <Section title="설명">
        <input
          className={inputClass}
          aria-label="설명"
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          onBlur={() => textDraft.trim() !== text && saveNote({ text: textDraft })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length > 0 ? String(uses.length) : '없음'} empty={uses.length === 0}>
        <div className="space-y-blocks">
          {uses.map((u) => (
            <div key={u.index}>
              <button
                type="button"
                onClick={() => onOpenComponent(u.index)}
                className={linkRowClass}
              >
                <span className="truncate">{u.name}</span>
                <span className="ml-row-inner shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
              </button>
              <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
            </div>
          ))}
        </div>
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <CodeRows uses={[...(classed ? [`z-${short}`] : []), `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/**
 * 겹치는 차례를 만드는 양식. 이름, 차례(숫자), 묶음, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 차례는 비운 채로 시작한다. 무엇보다 위여야 하는지는 사람이 정하는 것이라, 숫자를 미리 채워 두면 이름만 적고 만들었을 때 엉뚱한 차례가 생긴다.
 */
export function NewLayerForm({ tokens, onCreate, onCancel }: { tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  const kind = KINDS.z
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [group, setGroup] = useState<LayerGroup | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; value?: string }>({})
  const shownGroup = group ?? guessLayerGroup(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    const problem = nameProblem(kind, n, tokens)
    if (problem) next.name = problem
    if (!value.trim()) next.value = '순서를 입력해 주세요.'
    else if (!NUMBER.test(value.trim())) next.value = '정수를 입력해 주세요.'
    setError(next)
    if (Object.keys(next).length === 0) onCreate(kind.prefix + n, String(Number(value.trim())), writeLayerNote(shownGroup, text))
  }

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="dialog"
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="순서" error={error.value}>
        <input
          className={inputClass}
          value={value}
          inputMode="numeric"
          placeholder="50"
          onChange={(e) => {
            setValue(e.target.value)
            setError({ ...error, value: undefined })
          }}
        />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={LAYER_GROUPS} value={shownGroup} nameWidth="w-picker-name-wide" onChange={setGroup} />
      </Field>
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="mt-dialog-actions flex justify-end gap-actions">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          추가
        </Button>
      </div>
    </form>
  )
}
