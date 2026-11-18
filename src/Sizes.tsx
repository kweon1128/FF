// 크기 판(토대)의 패널과 추가 창, 의미 크기 판의 내용.
// 의미 크기 판은 쓰임마다 이름과 가리키는 크기, 설명, 그 크기가 실제로 쓰인 모습을 보여 준다.

import { CHECK_STROKE, ICON_STROKE } from './lib/icons'
import { useContext, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, Check as CheckIcon, ChevronDown, Copy, Folder, Minus, Plus, X } from 'lucide-react'
import type { Token } from './lib/api'
import { ALL_KINDS, KINDS, SLUG, lengthLabel, shortName, type Kind } from './lib/catalog'
import { resolveColor, surroundings, type Around } from './lib/roles'
import { SIZE_GROUPS, SIZE_SHAPES, SIZE_WORDS, guessSizeGroup, isSizeKind, isSizeListShape, lengthRefOf, readSizeNote, resolveLength, writeSizeNote, type SizeExample, type SizeGroup, type SizeShape } from './lib/sizes'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UnitInput, UsePicker, inputClass } from './ui'
import { useReorder } from './useReorder'
import { orderKinds } from './lib/order'

const LENGTH = KINDS.length

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'
// 크기를 재는 치수선의 색. FF의 안내 색 그대로다. 의미 간격 판의 옅은 띠와 같은 색이지만 모양이 다르다:
// 띠는 비어 있는 자리(여백)를 칠하는 것이고, 크기는 요소 자체의 길이라 그 옆에 선을 그어 잰다. 요소를 색으로 덮으면 무엇의 크기인지가 가려진다.
const MARK = 'var(--color-guide)'

/** 치수선이 차지하는 자리(px): 요소와의 거리 8, 선의 굵기 1, 선 밖으로 나가는 가로대 3. 예시 상자가 선이 놓이는 쪽에 이만큼 여백을 더 둔다. */
const RESERVE = 12
/** 치수선에 적는 값의 이름표. 판을 끌 때 간격을 적는 이름표와 같은 모양이다(안내 색 바탕에 흰 숫자, 높이 16px). 선의 바깥쪽에 4px 띄워 놓는다. */
const TAG = 'rounded-tag bg-guide px-[4px] type-caption-strong whitespace-nowrap text-on-selection tabular-nums'
const TAG_GAP = 4
const TAG_HEIGHT = 16
/** 이름표의 폭(px)을 어림한 값. 좌우 여백 4씩에 숫자 한 글자가 7쯤이다. 예시 상자의 여백을 정하는 데 쓴다. */
const tagWidth = (text: string) => 8 + 7 * text.length

/** 그림이 예시 칸에 들어가는 가장 큰 길이(px). 이보다 크면 절반씩 줄여 그린다. 폭은 칸이 넓어서 더 크게 잡는다. */
const LIMIT = { height: 200, width: 520, square: 200 }

/** 그 크기를 몇 분의 일로 줄여 그리는지. 줄이지 않으면 1. pair는 폭과 함께 그리는 높이다. 둘 가운데 더 많이 줄여야 하는 쪽을 따른다. */
export function sampleScale(kind: Kind, value: string, pair?: string): number {
  const px = parseFloat(value)
  const limit = LIMIT[kind.id as keyof typeof LIMIT] ?? 200
  const own = [1, 2, 4, 8].find((n) => px / n <= limit) ?? 8
  return pair === undefined ? own : Math.max(own, sampleScale(KINDS.height, pair))
}

/**
 * 크기가 실제로 쓰인 모습. 무엇의 크기인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 재는 것(그 높이, 그 폭)의 옆에 안내 색의 치수선을 긋는다. 선의 길이가 그 값이고 양 끝에 짧은 가로대가 있다(도면에서 길이를 적는 선).
 * 높이는 요소의 왼쪽에 세로선, 폭은 요소의 위에 가로선, 정사각형은 둘 다다. 요소는 칠하지 않는다. 길이는 값 그대로다. 예시 칸보다 큰 것만 통째로 줄여 그리고, 판의 줄이 몇 분의 일인지 적는다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 간격과 다른 크기는 보여 주는 시스템의 값으로 그려진다(PreviewSpaceContext).
 */
export function SizeSample({ kind, shape, value, pair, around, tint, words: written = '' }: { kind: Kind; shape: SizeShape; value: string; pair?: string; around: Around; tint: string; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || SIZE_WORDS[shape]
  const list = isSizeListShape(shape)
    ? all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
    : [all]
  // pair는 폭과 함께 그릴 높이다(요소별 보기에서 높이와 폭이 함께 있는 요소). 있으면 정사각형처럼 폭과 높이를 모두 정해 그리고, 두 치수선을 함께 긋는다(높이는 왼쪽, 폭은 위).
  const both = kind.id === 'width' && pair !== undefined
  const high = (both && pair) || value
  const tall = kind.id === 'height'
  const wide = kind.id === 'width' && !both
  const scale = sampleScale(kind, value, both ? pair : undefined)
  const TEXT = 'text-sm leading-5'
  const SMALL = 'text-xs leading-4'
  const line = `color-mix(in oklab, ${around.ink} 32%, ${around.surface})`
  const faint = `color-mix(in oklab, ${around.ink} 16%, ${around.surface})`
  const hover = `color-mix(in oklab, ${around.ink} 8%, ${around.surface})`
  const soft = `color-mix(in oklab, ${around.ink} 56%, ${around.surface})`
  const ring = { boxShadow: `inset 0 0 0 1px ${line}` }
  // 재는 것을 채우는 클래스. 재는 방향으로는 재는 상자를 꽉 채운다.
  const F = `relative shrink-0 ${tall ? 'h-full' : wide ? 'w-full' : 'size-full'}`
  // 재지 않는 방향의 크기. 높이를 재는 그림은 폭을, 폭을 재는 그림은 높이를 그 요소의 평소 크기로 둔다.
  const other = (w: string, h: string) => (tall ? w : wide ? h : '')
  const dims: CSSProperties = tall ? { height: value } : wide ? { width: value } : { width: value, height: high }
  // 치수선의 굵기(1px), 요소와의 거리(8px), 끝의 가로대 길이(7px). 줄여 그리는 그림에서도 화면에는 같은 굵기로 보이도록 줄인 만큼 키운다.
  const thick = scale
  const away = 8 * scale + thick
  const cap = 7 * scale
  const capAt = -(cap - thick) / 2
  // 선에 적는 값. 단위 없이 숫자만 적는다(32). 줄여 그리는 그림에서도 실제 값을 적는다.
  const amount = String(parseFloat(value))
  // 높이의 선에 적는 값. 폭과 함께 그릴 때는 짝지은 높이다.
  const amountHigh = String(parseFloat(high))
  /** 재는 상자. 이 상자의 높이(폭)가 그 값이고, 치수선이 그 옆에 같은 길이로 그어진다. */
  // inset은 재는 상자가 눈에 보이는 요소의 가장자리에서 안쪽으로 들어가 있는 만큼이다(전환 버튼의 칸은 바깥 상자의 안쪽 여백만큼 들어가 있다).
  // 그만큼 선을 더 밖으로 내서, 선과 눈에 보이는 요소 사이가 어느 예시에서나 8px이 되게 한다.
  const m = (children: ReactNode, more = '', inset = 0) => (
    <span data-sample className={`relative flex shrink-0 ${more}`} style={{ ...dims, zoom: 1 / scale }}>
      {!wide && (
        <span data-measure="height" className="pointer-events-none absolute" style={{ top: 0, bottom: 0, left: -away - inset * scale, width: thick, background: MARK }}>
          <span className="absolute" style={{ top: 0, left: capAt, width: cap, height: thick, background: MARK }} />
          <span className="absolute" style={{ bottom: 0, left: capAt, width: cap, height: thick, background: MARK }} />
          {/* 값의 이름표. 선의 한가운데 높이에서 선의 왼쪽에 놓는다. 요소를 가리지 않는다. 줄여 그리는 그림에서도 글자는 제 크기다. 이름표에만 zoom을 되돌린다(자리를 잡는 바깥 상자에 주면 그 거리까지 함께 커진다). */}
          <span className="absolute" style={{ top: '50%', left: -(cap - thick) / 2 - TAG_GAP * scale }}>
            <span data-measure-tag className={`absolute top-0 right-0 -translate-y-1/2 ${TAG}`} style={{ zoom: scale }}>{amountHigh}</span>
          </span>
        </span>
      )}
      {!tall && (
        <span data-measure="width" className="pointer-events-none absolute" style={{ left: 0, right: 0, top: -away - inset * scale, height: thick, background: MARK }}>
          <span className="absolute" style={{ left: 0, top: capAt, height: cap, width: thick, background: MARK }} />
          <span className="absolute" style={{ right: 0, top: capAt, height: cap, width: thick, background: MARK }} />
          {/* 값의 이름표. 선의 한가운데에서 선의 위쪽에 놓는다. */}
          <span className="absolute" style={{ left: '50%', top: -(cap - thick) / 2 - TAG_GAP * scale }}>
            <span data-measure-tag className={`absolute bottom-0 left-0 -translate-x-1/2 ${TAG}`} style={{ zoom: scale }}>{amount}</span>
          </span>
        </span>
      )}
      {children}
    </span>
  )
  // 치수선이 놓이는 쪽(높이는 왼쪽, 폭은 위쪽, 정사각형은 둘 다)은 예시 상자의 안쪽 여백을 그만큼 더 준다.
  // 선은 요소에서 8px 떨어져 있고 굵기 1px에 가로대가 3px 더 나가므로 12px이 든다. 더 주지 않으면 선의 가로대가 상자의 가장자리에 닿는다.
  // 이름표가 놓이는 자리도 더한다: 왼쪽은 이름표의 폭, 위쪽은 이름표의 높이, 그리고 선과 이름표 사이 4px.
  const roomLeft = `calc(var(--spacing-sample) + ${RESERVE + TAG_GAP + tagWidth(amountHigh)}px)`
  const roomTop = `calc(var(--spacing-sample) + ${RESERVE + TAG_GAP + TAG_HEIGHT}px)`
  const frame = (body: ReactNode) => (
    <span
      className={`flex w-full items-center justify-center overflow-hidden rounded-card p-sample ${EDGE}`}
      style={{ ...space, background: around.surface, color: around.ink, fontFamily: font, ...(wide ? {} : { paddingLeft: roomLeft }), ...(tall ? {} : { paddingTop: roomTop }) }}
    >
      {body}
    </span>
  )
  const bar = (more = '') => <span className={`block h-[8px] rounded-small ${more}`} style={{ background: faint }} />
  const square = (icon: ReactNode) => (
    <span className="flex size-icon-button shrink-0 items-center justify-center rounded-control" style={{ background: hover, color: soft }}>
      {icon}
    </span>
  )
  switch (shape) {
    case 'input':
      return frame(m(<span className={`${F} ${other('w-[160px]', 'h-control')} flex items-center overflow-hidden rounded-control px-input-x whitespace-nowrap ${TEXT}`} style={ring}>{all}</span>))
    case 'button':
      // 나란한 버튼. 마지막은 채운 버튼이다(취소, 추가처럼 끝의 것이 주된 동작이다).
      return frame(
        m(
          <span className={`${F} ${other('', 'h-control')} flex items-stretch gap-actions`}>
            {list.map((text, i) => (
              <span
                key={i}
                className={`flex flex-1 items-center justify-center rounded-control px-button-x font-[550] whitespace-nowrap ${TEXT}`}
                style={list.length > 1 && i === list.length - 1 ? { background: around.ink, color: around.surface } : ring}
              >
                {text}
              </span>
            ))}
          </span>,
        ),
      )
    case 'row':
      // 메뉴 줄. 마우스를 올린 모습(옅은 바탕)으로 그려 줄이 어디까지인지 보여 준다.
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-row')} flex items-center gap-row-inner overflow-hidden rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={{ background: hover }}>
            <span className="block size-icon shrink-0 rounded-small" style={{ background: soft }} />
            {all}
          </span>,
        ),
      )
    case 'field':
      return frame(m(<span className={`${F} ${other('', 'h-compact')} flex items-center overflow-hidden rounded-small px-chip-x font-mono whitespace-nowrap ${SMALL}`} style={ring}>{all}</span>))
    case 'segment':
      // 전환 버튼. 옅은 바탕의 상자 안에 칸들이 있고, 고른 칸만 바탕이 다르다. 재는 것은 칸이다.
      return frame(
        <span className="flex rounded-control p-menu" style={{ background: hover }}>
          {m(
            <span className={`${F} ${other('', 'h-compact')} flex gap-actions-tight`}>
              {list.map((text, i) => (
                <span
                  key={i}
                  className={`flex flex-1 items-center justify-center rounded-small px-row-x font-[550] whitespace-nowrap ${SMALL}`}
                  style={i === 0 ? { background: around.surface, ...ring } : { color: soft }}
                >
                  {text}
                </span>
              ))}
            </span>,
            '',
            // 칸은 바깥 상자의 안쪽 여백(4px)만큼 들어가 있다.
            4,
          )}
        </span>,
      )
    case 'value':
      // 올리고 내리는 버튼 사이의 값. 재는 것은 가운데의 값 칸이다.
      return frame(
        <span className="flex items-center gap-actions-tight">
          {square(<Minus size={16} strokeWidth={ICON_STROKE} />)}
          {m(<span className={`${F} ${other('', 'h-control')} flex items-center justify-center whitespace-nowrap tabular-nums ${TEXT}`}>{all}</span>)}
          {square(<Plus size={16} strokeWidth={ICON_STROKE} />)}
        </span>,
      )
    case 'slider':
      return frame(m(<span className={`${F} ${other('w-[160px]', 'h-[12px]')} block rounded-pill`} style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />))
    case 'iconbutton':
      return frame(
        m(
          // 마우스를 올린 모습(옅은 바탕)으로 그려 버튼이 어디까지인지 보여 준다. 문구가 "닫기"면 귀퉁이의 X 버튼이고, 아니면 복사 버튼이다.
          <span className={`${F} flex items-center justify-center rounded-control`} style={{ background: hover, color: soft }}>
            {all === '닫기' ? <X size={16} strokeWidth={ICON_STROKE} /> : <Copy size={16} strokeWidth={ICON_STROKE} />}
          </span>,
        ),
      )
    case 'icon':
      return frame(m(<Plus className={F} strokeWidth={ICON_STROKE} />))
    case 'check':
      return frame(
        m(
          <span className={`${F} flex items-center justify-center rounded-small`} style={{ background: around.ink, color: around.surface }}>
            <CheckIcon size={12} strokeWidth={CHECK_STROKE} />
          </span>,
        ),
      )
    case 'mark':
      return frame(m(<CheckIcon className={F} strokeWidth={CHECK_STROKE} />))
    case 'handle':
      return frame(m(<span className={`${F} block`} style={{ background: around.surface, boxShadow: `inset 0 0 0 1px ${tint}` }} />))
    case 'knob':
      return frame(m(<span className={`${F} block rounded-pill border-[4px] border-white shadow-[0_0_0_0.5px_rgb(0_0_0/0.25),0_1px_3px_rgb(0_0_0/0.35)]`} style={{ background: tint }} />))
    case 'bar':
      // 상단 바. 디자인 시스템을 고르는 자리(폴더 아이콘, 이름, 화살표)가 놓이고 아래에 선이 있다.
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-bar')} flex items-center gap-row-inner overflow-hidden px-bar-x font-[550] whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 -1px 0 ${line}` }}>
            <Folder size={16} strokeWidth={ICON_STROKE} className="shrink-0" />
            {all}
            <ChevronDown size={16} strokeWidth={ICON_STROKE} className="shrink-0" style={{ color: soft }} />
          </span>,
        ),
      )
    case 'heading':
      // 제목 줄. 첫 문구가 제목, 나머지가 오른쪽의 버튼이다.
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-compact')} flex items-center justify-between gap-columns font-[550] whitespace-nowrap ${SMALL}`}>
            <span>{list[0]}</span>
            <span style={{ color: soft }}>{list.slice(1).join(', ')}</span>
          </span>,
        ),
      )
    case 'line':
      return frame(
        m(
          <span className={`${F} ${other('', 'h-[20px]')} flex items-center gap-row-inner whitespace-nowrap ${TEXT}`}>
            <span className="flex size-checkbox shrink-0 items-center justify-center rounded-small" style={{ background: around.ink, color: around.surface }}>
              <CheckIcon size={12} strokeWidth={CHECK_STROKE} />
            </span>
            {all}
          </span>,
        ),
      )
    case 'toast':
      return frame(m(<span className={`${F} ${other('', 'h-control')} flex items-center overflow-hidden rounded-control px-bar-x whitespace-nowrap ${TEXT}`} style={{ background: around.ink, color: around.surface }}>{all}</span>))
    case 'card':
      // 카드. 위에 이름 줄이 있고 그 아래에 내용이 있다. 재는 것은 이름 줄이다.
      return frame(
        <span className={`block rounded-card ${other('w-[160px]', '')}`} style={ring}>
          {m(<span className={`${F} ${other('w-full', 'h-[40px]')} flex items-center px-section-x whitespace-nowrap ${SMALL}`} style={{ color: soft }}>{all}</span>, tall ? 'w-full' : '')}
          <span className="block px-section-x pb-section-y">{bar('w-full')}</span>
        </span>,
      )
    case 'list':
      // 줄이 넘치면 스크롤되는 목록 상자. 재는 것은 상자의 높이(폭)이고, 줄은 그 안에서 잘린다.
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-[144px]')} block overflow-hidden rounded-card p-box`} style={ring}>
            <span className="block space-y-rows">
              {Array.from({ length: 16 }, (_, i) => list[i % list.length]).map((text, i) => (
                <span key={i} className={`flex h-row items-center rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: hover } : undefined}>
                  {text}
                </span>
              ))}
            </span>
          </span>,
        ),
      )
    case 'menu':
      return frame(
        m(
          <span className={`${F} block space-y-rows rounded-float p-menu`} style={ring}>
            {list.map((text, i) => (
              <span key={i} className={`flex h-row items-center overflow-hidden rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: hover } : undefined}>
                {text}
              </span>
            ))}
          </span>,
        ),
      )
    case 'frame': {
      // 면(패널, 창)을 실제 모습대로 그린다. 문구는 차례대로 제목, 입력칸의 이름표, 아래 버튼들이다("의미 색 추가, 이름, 취소, 추가").
      // 제목이 없는 면(창의 왼쪽 설정 칸)은 제목 자리에 "-"를 적는다. 이름표가 없으면 내용을 막대로 대신 그린다(내용이 정해져 있지 않은 화면).
      const [title, label, ...actions] = list
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', '')} block overflow-hidden rounded-float px-section-x py-section-y`} style={ring}>
            {title && title !== '-' && <span className={`mb-heading block font-[650] whitespace-nowrap ${TEXT}`}>{title}</span>}
            {label ? (
              <span className="block w-[224px] max-w-full">
                <span className={`mb-label block font-[550] whitespace-nowrap ${SMALL}`} style={{ color: soft }}>
                  {label}
                </span>
                <span className="block h-control rounded-control" style={ring} />
              </span>
            ) : (
              <>
                {bar('w-3/4')}
                {bar('mt-blocks w-1/2')}
              </>
            )}
            {actions.length > 0 && (
              <span className="mt-settings flex justify-end gap-actions">
                {actions.map((text, i) => (
                  <span
                    key={i}
                    className={`flex h-control items-center rounded-control px-button-x font-[550] whitespace-nowrap ${TEXT}`}
                    style={i === actions.length - 1 ? { background: around.ink, color: around.surface } : undefined}
                  >
                    {text}
                  </span>
                ))}
              </span>
            )}
          </span>,
        ),
      )
    }
    case 'column':
      // 한 줄 안의 글자 칸. 재는 것은 글자 칸이고, 그 옆에 다음 칸을 옅게 그려 어디까지인지 보여 준다. 첫 문구는 진하게, 나머지는 옅게 적는다.
      return frame(
        <span className="flex items-center gap-columns">
          {m(
            <span className={`${F} block overflow-hidden`}>
              {list.map((text, i) => (
                <span key={i} className={`block whitespace-nowrap ${i === 0 ? `font-[550] ${TEXT}` : SMALL}`} style={i === 0 ? undefined : { color: soft }}>
                  {text}
                </span>
              ))}
            </span>,
          )}
          <span className="block h-[40px] w-[48px] rounded-card" style={{ background: faint }} />
        </span>,
      )
    case 'color':
      return frame(m(<span className={`${F} ${other('w-[96px]', 'h-[64px]')} block rounded-card`} style={{ background: tint }} />))
    case 'preview':
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-[96px]')} flex items-center justify-center rounded-float`} style={ring}>
            <span className={`flex h-control items-center rounded-control px-button-x font-[550] whitespace-nowrap ${TEXT}`} style={{ background: around.ink, color: around.surface }}>
              {all}
            </span>
          </span>,
        ),
      )
    case 'picker':
      return frame(m(<span className={`${F} ${other('w-[160px]', 'h-[144px]')} block rounded-card`} style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${tint})` }} />))
    case 'stage':
      // 효과를 얹어 보이는 무대. 막대들이 놓인 면이다.
      return frame(
        m(
          <span className={`${F} ${other('w-[160px]', 'h-[80px]')} block overflow-hidden`}>
            {bar('w-3/4')}
            {bar('mt-blocks w-1/2')}
            {bar('mt-blocks w-2/3')}
            {bar('mt-blocks w-1/3')}
          </span>,
        ),
      )
    case 'placeholder':
      return frame(m(<span className={`${F} ${other('w-[96px]', 'h-[8px]')} block rounded-small`} style={{ background: faint }} />))
    case 'badge':
      return frame(m(<span className={`${F} ${other('', 'h-compact')} flex items-center justify-center overflow-hidden rounded-pill px-row-x font-[550] whitespace-nowrap ${SMALL}`} style={{ background: hover }}>{all}</span>))
    case 'dot':
      return frame(m(<span className={`${F} block rounded-pill`} style={{ background: around.ink }} />))
    default:
      return frame(m(<span className={`${F} ${other('w-[96px]', 'h-[40px]')} block rounded-card`} style={{ background: faint }} />))
  }
}

/** 판과 패널에 적는 값. 가리키는 크기의 길이를 적는다(32px). 가리키는 값이 없어졌으면 그 이름 뒤에 "없어짐"을 붙인다(의미 간격과 같다). */
function shownOf(tokens: Token[], value: string) {
  const ref = lengthRefOf(value)
  const length = resolveLength(tokens, value)
  return { ref, length, shown: length ?? (ref ? `${lengthLabel(LENGTH, ref)} · 없어짐` : value) }
}

/** 그림에 깔아 줄 크기 변수들. 토대는 적힌 길이 그대로, 의미 크기는 가리키는 토대의 길이로 풀어서 넣는다(가리키는 값이 없어진 것은 뺀다). */
export function sizeVars(tokens: Token[]): CSSProperties {
  const vars: Record<string, string> = {}
  for (const t of tokens) {
    const kind = [KINDS.height, KINDS.width, KINDS.square].find((k) => k.matches(t.name))
    const length = kind ? resolveLength(tokens, t.value) : LENGTH.matches(t.name) ? t.value : null
    if (length) vars[t.name] = length
  }
  return vars as CSSProperties
}

/**
 * 의미 크기 판에서 한 종류(높이, 폭, 정사각형)의 내용. 묶음(컨트롤, 영역)마다 작은 제목을 두고, 한 줄에 크기 하나.
 * 왼쪽 칸(224px)에 이름, 가리키는 길이, 설명이 있고 오른쪽에 그 크기가 실제로 쓰인 모습이 있다. 예시는 주석에 모양을 적어 둔 값에만 있다.
 * 묶음은 정해진 차례로 놓는다. 종류의 제목(높이, 폭, 정사각형)이 따로 있어서, 묶음의 제목은 그보다 옅고 작게 적는다.
 */
export function SizeList({
  kind,
  items,
  all,
  selected,
  onSelect,
  onSelectGroup,
  onRename,
  onMove,
  onMoveGroup,
}: {
  kind: Kind
  items: Token[]
  /** 가리키는 크기의 길이와, 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 의미 크기는 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
  /** 묶음 제목을 끌어 이 종류 안에서 묶음의 차례를 바꾼다. */
  onMoveGroup?: (group: SizeGroup, before: SizeGroup | null) => void
}) {
  const rows = items.map((t) => ({ t, short: shortName(kind, t.name), ...readSizeNote(t.note, shortName(kind, t.name)) }))
  // 묶음은 파일에 처음 나오는 차례대로 놓는다. 끌어서 바꾼 차례가 파일에 남는다.
  const groups = [...new Set(rows.map((r) => r.group))]
  // 한 판에 종류가 셋이고 종류마다 같은 이름의 묶음이 있어서, 끄는 것을 찾는 이름에 종류를 붙인다(height:control).
  const key = (group: string) => `${kind.id}:${group}`
  const bare = (name: string | null) => (name === null ? null : (name.slice(kind.id.length + 1) as SizeGroup))
  const groupDrag = useReorder(groups.map(key), onMoveGroup && ((name, before) => onMoveGroup(bare(name)!, bare(before))), { attr: 'data-size-group', gap: 16 })
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 판 위의 버튼으로 한다.
  if (items.length === 0) return null
  const around = surroundings(all)
  // 색 칸과 손잡이를 칠할 색. 이 시스템의 선택 색(없으면 주요 색, 그것도 없으면 글자 색)이다.
  const tinted = all.find((t) => t.name === '--color-selection') ?? all.find((t) => t.name === '--color-primary')
  const tint = (tinted && resolveColor(all, tinted.value)) || around.ink
  return (
    <div className="space-y-settings">
      {groups.map((id) => {
        const g = SIZE_GROUPS.find((x) => x.id === id)!
        const list = rows.filter((r) => r.group === g.id)
        // 줄을 묶음의 맨 끝에 놓으면, 파일에서도 이 묶음의 마지막 줄 바로 뒤에 놓는다. 파일의 맨 끝으로 보내면 다른 묶음의 값들 뒤로 간다.
        const moveRow =
          onMove &&
          ((name: string, before: string | null) => {
            if (before !== null) return onMove(name, before)
            const last = list.filter((r) => r.t.name !== name).at(-1)
            const after = last ? items.slice(items.indexOf(last.t) + 1).find((t) => t.name !== name) : undefined
            onMove(name, after?.name ?? null)
          })
        return (
          <div key={g.id} data-size-group={key(g.id)} className={`relative ${groupDrag.moving(key(g.id)) ? 'opacity-40' : ''}`}>
            {groupDrag.line(key(g.id))}
            {/* 묶음의 제목. 누르면 그 묶음의 값이 모두 선택되고, 끌면 이 종류 안에서 묶음의 차례가 바뀐다(다른 의미 판의 묶음 제목과 같다). */}
            <button
              type="button"
              onClick={(e) => !groupDrag.justDragged() && onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              {...groupDrag.grab(key(g.id))}
              className={`mb-label -ml-chip-x block rounded-small px-chip-x type-label text-ink-faint outline-selection hover:bg-hover focus-visible:outline-focus ${onMoveGroup ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {g.label}
            </button>
            <SizeRows kind={kind} list={list} all={all} around={around} tint={tint} selected={selected} onSelect={onSelect} onRename={onRename} onMove={moveRow} />
          </div>
        )
      })}
    </div>
  )
}

/** 한 묶음의 줄들. 줄을 끌면 같은 묶음 안에서 차례가 바뀐다. 다른 묶음으로는 끌어 옮기지 않고 패널의 "묶음"에서 바꾼다. */
function SizeRows({
  kind,
  list,
  all,
  around,
  tint,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  kind: Kind
  list: { t: Token; short: string; text: string; examples: SizeExample[] }[]
  all: Token[]
  around: Around
  tint: string
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(list.map((r) => r.t.name), onMove)
  return (
    <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
      {list.map(({ t, short, text, examples }) => {
        const isSelected = selected.includes(t.name)
        const { length, shown } = shownOf(all, t.value)
        // 예시는 가리키는 길이가 있고 주석에 모양이 적혀 있을 때만 그린다. 없으면 왼쪽 칸이 줄 전체를 쓴다.
        const drawn = !plain && length !== null && examples.length > 0
        const scale = length ? sampleScale(kind, length) : 1
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${shown}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            <span className={drawn ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
              <span data-name className="block type-label break-words">
                {short}
              </span>
              <span data-points className={`block type-code-sm break-words ${length ? 'text-ink-faint' : 'text-danger'}`}>
                {shown}
                {/* 예시 칸보다 커서 줄여 그린 것은 몇 분의 일인지 적는다. 적지 않으면 그림의 크기를 그 값으로 읽게 된다. */}
                {drawn && scale > 1 && ` · 그림은 1/${scale}`}
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
                {examples.map((e, k) => (
                  <SizeSample key={k} kind={kind} shape={e.shape} value={length} around={around} tint={tint} words={e.words} />
                ))}
              </span>
            )}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={shown} />}
          </button>
        )
      })}
    </div>
  )
}

/** 의미 크기 판을 보는 방식. 종류별(높이 / 폭 / 정사각형 안에 묶음)과 요소별(묶음 안에 요소마다 그 높이와 폭을 함께). */
export type SizeView = 'kind' | 'thing'

const SIZE_VIEWS: { id: SizeView; label: string }[] = [
  { id: 'kind', label: '종류별' },
  { id: 'thing', label: '요소별' },
]

/** 보는 방식을 바꾸는 전환 버튼. 판 오른쪽 위, "원래대로"의 왼쪽에 둔다. 높이는 옆의 버튼과 같다(칸 24px에 안쪽 여백 4px씩). */
export function SizeViewSwitch({ value, onChange }: { value: SizeView; onChange: (next: SizeView) => void }) {
  return (
    <div role="radiogroup" aria-label="보는 방식" className="flex gap-actions-tight rounded-control bg-hover p-menu">
      {SIZE_VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          aria-checked={value === v.id}
          onClick={() => value !== v.id && onChange(v.id)}
          className={`h-compact rounded-small px-row-x outline-selection focus-visible:outline-focus ${
            value === v.id ? 'bg-canvas type-label text-ink shadow-[0_0_0_var(--border-width-edge)_var(--color-hairline)]' : 'type-body text-ink-soft hover:text-ink'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

const SIZE_KINDS_IN_ORDER = [KINDS.height, KINDS.width, KINDS.square]
/** 요소별 보기의 줄 앞에 적는, 그 값이 어느 쪽 길이인지. */
const DIMENSION: Record<string, string> = { height: '높이', width: '폭', square: '정사각형' }

type ThingRow = { t: Token; kind: Kind; short: string; group: SizeGroup; text: string; picked?: SizeShape; examples: SizeExample[]; length: string | null; shown: string }

/**
 * 의미 크기 판의 요소별 보기. 묶음(컨트롤, 영역) 안에서 요소마다 한 덩어리로, 그 요소의 높이와 폭과 정사각형을 함께 보여 준다.
 * 어떤 요소는 높이와 폭이 함께 있다(작은 입력칸은 높이 24에 폭이 56, 80, 112). 종류별 보기에서는 그것이 높이 묶음과 폭 묶음으로 흩어져서, 그 요소가 실제로 어떤 크기인지 한눈에 보이지 않는다.
 * 요소는 값의 첫 예시의 모양이다(주석의 "(모양)"). 같은 묶음에서 모양이 같은 값들이 종류를 넘어 한 덩어리가 된다. 모양을 적지 않은 값은 저마다 한 덩어리다.
 * 덩어리와 줄의 차례는 종류별 보기의 차례를 따른다(처음 나오는 차례). 이 보기에서는 차례를 바꾸지 않는다. 끌어 옮기기와 "원래대로"는 종류별 보기의 차례를 다룬다.
 */
export function SizeThings({
  tokens,
  selected,
  onSelect,
  onSelectGroup,
  onRename,
}: {
  tokens: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
}) {
  // 종류별 보기에 놓이는 차례 그대로 늘어놓는다: 종류(파일에 적힌 차례) → 묶음(처음 나오는 차례) → 줄.
  const rows: ThingRow[] = orderKinds(tokens, SIZE_KINDS_IN_ORDER).flatMap((kind) => {
    const list = tokens
      .filter((t) => kind.matches(t.name))
      .map((t) => {
        const short = shortName(kind, t.name)
        const { length, shown } = shownOf(tokens, t.value)
        return { t, kind, short, ...readSizeNote(t.note, short), length, shown }
      })
    return [...new Set(list.map((r) => r.group))].flatMap((g) => list.filter((r) => r.group === g))
  })
  if (rows.length === 0) return null
  const around = surroundings(tokens)
  // 색 칸과 손잡이를 칠할 색. 이 시스템의 선택 색(없으면 주요 색, 그것도 없으면 글자 색)이다.
  const tinted = tokens.find((t) => t.name === '--color-selection') ?? tokens.find((t) => t.name === '--color-primary')
  const tint = (tinted && resolveColor(tokens, tinted.value)) || around.ink
  // 묶음은 정해진 차례(컨트롤, 영역)로 놓는다. 종류마다 묶음의 차례가 다를 수 있어서, 이 보기에서는 어느 한 종류의 차례를 따르지 않는다.
  const groups = SIZE_GROUPS.filter((g) => rows.some((r) => r.group === g.id))
  return (
    <div className="space-y-groups">
      {groups.map((g) => {
        const list = rows.filter((r) => r.group === g.id)
        const keyOf = (r: ThingRow) => r.picked ?? `-${r.t.name}`
        const things = [...new Set(list.map(keyOf))].map((key) => ({ key, rows: list.filter((r) => keyOf(r) === key) }))
        return (
          <div key={g.id} data-thing-group={g.id}>
            {/* 묶음의 제목. 누르면 그 묶음의 값이 모두 선택된다. 이 보기에서는 끌어 옮기지 않는다. */}
            <button
              type="button"
              onClick={(e) => onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              className="mb-heading -ml-chip-x block rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus"
            >
              {g.label}
            </button>
            <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
              {things.map((thing) => (
                <SizeThing key={thing.key} rows={thing.rows} around={around} tint={tint} selected={selected} onSelect={onSelect} onRename={onRename} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 요소 하나. 왼쪽에 요소의 이름과 그 값들(어느 쪽 길이인지, 이름, 길이)이 한 줄씩 있고, 오른쪽에 그 요소를 그린 예시가 있다.
 * 값의 줄은 종류별 보기의 줄처럼 하나씩 고른다(누르면 그 값의 패널이 열리고, 두 번 누르면 이름을 고친다).
 * 높이가 있고 폭도 있는 요소는 폭마다 한 번씩, 그 폭과 높이로 그려서 두 치수선을 함께 긋는다(높이는 왼쪽, 폭은 위). 높이가 여럿이면 첫 높이와 짝짓고 나머지 높이는 따로 그린다.
 * 높이만, 폭만, 정사각형만 있는 요소는 종류별 보기와 똑같이 그린다. 값마다의 둘째 예시부터(다른 모양의 예시)도 그대로 그린다.
 */
function SizeThing({
  rows,
  around,
  tint,
  selected,
  onSelect,
  onRename,
}: {
  rows: ThingRow[]
  around: Around
  tint: string
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const shape = rows[0].picked
  const heights = rows.filter((r) => r.kind.id === 'height' && r.length !== null)
  const widths = rows.filter((r) => r.kind.id === 'width' && r.length !== null)
  // 폭과 짝지을 높이. 높이와 폭이 함께 있는 요소에만 있다.
  const base = shape && heights.length > 0 && widths.length > 0 ? heights[0] : null
  const paired = (r: ThingRow) => base !== null && r.kind.id === 'width' && r.length !== null
  // 그 값의 그림을 몇 분의 일로 줄여 그렸는지. 짝지은 높이는 그것과 함께 그린 폭들 가운데 가장 많이 줄인 것을 따른다.
  const scaleOf = (r: ThingRow) => {
    if (r.length === null || r.examples.length === 0) return 1
    if (base && paired(r)) return sampleScale(r.kind, r.length, base.length!)
    if (r === base) return Math.max(...widths.map((w) => sampleScale(w.kind, w.length!, base.length!)))
    return sampleScale(r.kind, r.length)
  }
  const drawings = plain
    ? []
    : rows.flatMap((r) =>
        r.length === null
          ? []
          : r.examples.flatMap((e, k) => {
              // 짝지은 높이의 첫 예시는 폭과 함께 그렸으므로 따로 그리지 않는다.
              if (k === 0 && r === base) return []
              return [<SizeSample key={`${r.t.name}:${k}`} kind={r.kind} shape={e.shape} value={r.length!} pair={k === 0 && paired(r) ? base!.length! : undefined} around={around} tint={tint} words={e.words} />]
            }),
      )
  return (
    <div data-thing={shape ?? rows[0].short} className="flex items-center gap-[calc(var(--spacing-columns)-var(--spacing-board-row-x))] pr-board-row-x">
      <div className={drawings.length > 0 ? 'w-[calc(var(--width-row-name)+var(--spacing-board-row-x)*2)] shrink-0 space-y-rows' : 'min-w-0 flex-1 space-y-rows'}>
        {shape && (
          <p data-thing-name className="px-board-row-x pt-board-row-y type-label">
            {SIZE_SHAPES.find((s) => s.id === shape)!.label}
          </p>
        )}
        {rows.map((r) => {
          const isSelected = selected.includes(r.t.name)
          const scale = scaleOf(r)
          return (
            <button
              key={r.t.name}
              type="button"
              data-token={r.t.name}
              aria-pressed={isSelected}
              aria-label={`${DIMENSION[r.kind.id]} ${r.short} ${r.shown}`}
              onClick={(e) => onSelect(r.t.name, isAdditive(e))}
              onDoubleClick={() => onRename(r.t.name)}
              className={`group relative block w-full rounded-row px-board-row-x py-board-row-y text-left select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
            >
              <span className="flex flex-wrap items-baseline gap-x-row-inner">
                <span data-dimension className="type-caption text-ink-faint">
                  {DIMENSION[r.kind.id]}
                </span>
                <span data-name className="min-w-0 type-body break-words">
                  {r.short}
                </span>
                <span data-points className={`type-code-sm break-words ${r.length ? 'text-ink-faint' : 'text-danger'}`}>
                  {r.shown}
                  {/* 예시 칸보다 커서 줄여 그린 것은 몇 분의 일인지 적는다. */}
                  {!plain && scale > 1 && ` · 그림은 1/${scale}`}
                </span>
              </span>
              {!plain && r.text && (
                <span data-text className="mt-label block type-caption break-words text-ink-faint">
                  <Phrases text={r.text} />
                </span>
              )}
              {isSelected && selected.length === 1 && <SelectionLabel name={r.short} value={r.shown} />}
            </button>
          )
        })}
      </div>
      {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
      {drawings.length > 0 && <div className="min-w-0 flex-1 space-y-blocks py-board-row-y">{drawings}</div>}
    </div>
  )
}

/** 가리킬 수 있는 크기들(크기 판의 값). 고르는 칸의 줄이 된다. 이름이 곧 길이라서 길이만 적는다. */
const baseOptions = (tokens: Token[]) => tokens.filter((t) => LENGTH.matches(t.name)).map((t) => ({ id: t.name, label: t.value, hint: '' }))

/** 그 크기를 코드에서 쓰는 법. 높이는 h-이름(최소와 최대도 같은 이름), 폭은 w-이름(최소와 최대는 변수를 가리켜 쓴다), 정사각형은 size-이름이다. */
function classesOf(kind: Kind, token: Token) {
  const short = shortName(kind, token.name)
  if (kind.id === 'height') return [`h-${short}`, `min-h-${short}`, `max-h-${short}`]
  if (kind.id === 'width') return [`w-${short}`, `min-w-(${token.name})`, `max-w-(${token.name})`]
  return [`size-${short}`]
}

/**
 * 의미 크기 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(가리키는 크기), 묶음, 설명, 쓰이는 곳, 코드.
 * 의미 크기는 크기 판의 값을 가리키기만 한다. 길이를 여기에 직접 적지 않는다(의미 색이 색상 판의 색만 가리키는 것과 같다).
 * 예시는 여기서 고치지 않는다. 그 크기가 화면 어디에 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function SizeInspector({
  token,
  kind,
  tokens,
  file,
  uses,
  onOpenComponent,
  onOpenToken,
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
  /** 가리키는 크기가 있는 판(크기 판)으로 가서 그 값을 보여 준다. */
  onOpenToken: (name: string) => void
  onRename: (next: string) => void
  /** 값(가리키는 크기)이나 주석(묶음, 설명, 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  const { group, text, picked, words, more } = readSizeNote(token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  const options = baseOptions(tokens)
  const { ref, length } = shownOf(tokens, token.value)
  const known = ref !== null && options.some((o) => o.id === ref)

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    if (tokens.some((t) => t.name === kind.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    onRename(kind.prefix + next)
  }

  // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
  const saveNote = (patch: { group?: SizeGroup; text?: string }) => onChange({ note: writeSizeNote(patch.group ?? group, patch.text ?? text, picked, words, more) })

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

      <Section title="가리키는 크기">
        {known ? (
          // 고르는 칸 옆에, 가리키는 크기가 크기 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다.
          <div className="flex items-center gap-actions-tight">
            <div className="min-w-0 flex-1">
              <UsePicker label="가리키는 크기" options={options} value={ref} nameWidth="w-[64px]" onChange={(next) => onChange({ value: `var(${next})` })} />
            </div>
            <button type="button" aria-label="가리키는 크기 보러 가기" title={`크기 판에서 ${lengthLabel(LENGTH, ref)} 보기`} onClick={() => onOpenToken(ref)} className={ICON_BUTTON}>
              <ArrowUpRight size={16} strokeWidth={ICON_STROKE} />
            </button>
          </div>
        ) : (
          // 가리키던 크기가 없어졌다. 다시 고르게 한다.
          <div className="space-y-blocks">
            <p className="type-body text-danger">고른 값이 없어졌어요. 다시 골라 주세요.</p>
            <div className="flex flex-wrap gap-actions-tight">
              {options.map((o) => (
                <Button key={o.id} variant="ghost" onClick={() => onChange({ value: `var(${o.id})` })}>
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="묶음">
        <UsePicker label="묶음" options={SIZE_GROUPS} value={group} onChange={(next) => saveNote({ group: next })} />
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
                className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-control px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-focus"
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
        <CodeRows uses={[...classesOf(kind, token), `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} valueNote={length ?? undefined} />
      </FoldSection>
    </div>
  )
}

/** 의미 크기의 종류. 추가 창에서 고른다(이름은 진하게, 쓰는 클래스와 그 종류에 드는 것은 옅게). */
const SIZE_KINDS: { id: 'height' | 'width' | 'square'; label: string; hint: string }[] = [
  { id: 'height', label: '높이', hint: 'h-이름. 입력칸, 줄, 막대' },
  { id: 'width', label: '폭', hint: 'w-이름. 메뉴, 패널, 창' },
  { id: 'square', label: '정사각형', hint: 'size-이름. 아이콘, 아이콘 버튼' },
]

/**
 * 의미 크기를 만드는 양식. 종류(높이, 폭, 정사각형), 이름, 가리키는 크기, 묶음, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 가리키는 크기는 고르지 않은 채로 시작한다. 첫 값을 골라 두면 이름만 적고 만들었을 때 엉뚱한 크기를 가리키는 값이 생긴다.
 * "추가"는 판에 하나뿐이고 종류는 여기서 고른다(효과의 추가가 쓰임을 창 안에서 고르는 것과 같다). start는 처음에 골라 둘 종류다.
 */
export function NewSizeForm({ start, tokens, onCreate, onCancel }: { start?: Kind; tokens: Token[]; onCreate: (kind: Kind, name: string, value: string, note: string) => void; onCancel: () => void }) {
  const options = baseOptions(tokens)
  const [kindId, setKindId] = useState<'height' | 'width' | 'square'>(start && isSizeKind(start) ? (start.id as 'height' | 'width' | 'square') : 'height')
  const kind = KINDS[kindId]
  const [name, setName] = useState('')
  const [ref, setRef] = useState<string | null>(null)
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [group, setGroup] = useState<SizeGroup | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; ref?: string }>({})
  const shownGroup = group ?? guessSizeGroup(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    if (!n) next.name = '이름을 입력해 주세요.'
    else if (!SLUG.test(n)) next.name = '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
    else if (tokens.some((t) => t.name === kind.prefix + n)) next.name = '같은 이름이 이미 있어요.'
    if (!ref) next.ref = '크기를 골라 주세요.'
    setError(next)
    if (Object.keys(next).length === 0 && ref) onCreate(kind, kind.prefix + n, `var(${ref})`, writeSizeNote(shownGroup, text))
  }

  // 가리킬 크기가 하나도 없으면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  if (options.length === 0)
    return (
      <div>
        <p className="type-body text-ink-soft">의미 크기는 크기 판의 값을 가리켜요. 크기 판에 값을 먼저 추가해 주세요.</p>
        <div className="mt-dialog-actions flex justify-end">
          <Button onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="종류" plain>
        <UsePicker
          label="종류"
          options={SIZE_KINDS}
          nameWidth="w-[64px]"
          value={kindId}
          onChange={(next) => {
            setKindId(next)
            // 같은 이름이 있는지는 종류마다 다르다.
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder={kind.id === 'height' ? 'control' : kind.id === 'width' ? 'panel' : 'icon'}
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="가리키는 크기" plain error={error.ref}>
        <UsePicker
          label="가리키는 크기"
          options={options}
          value={ref}
          nameWidth="w-[64px]"
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={SIZE_GROUPS} value={shownGroup} onChange={setGroup} />
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

const DIGITS = /^\d*\.?\d+$/

/**
 * 길이를 적은 숫자가 쓸 수 있는 값인지. 쓸 수 없으면 까닭을 돌려준다. 이름이 그 숫자가 되므로 정수여야 하고, 같은 길이가 이미 있으면 안 된다.
 * kind는 토대의 종류다. 크기(--length-)와 간격(--gutter-), 모서리(--corner-), 테두리(--thickness-)가 같은 규칙을 쓴다.
 */
function lengthProblem(kind: Kind, digits: string, tokens: Token[], self?: string) {
  if (!digits.trim()) return '길이를 입력해 주세요.'
  if (!DIGITS.test(digits) || !Number.isInteger(Number(digits)) || Number(digits) <= 0) return '0보다 큰 정수를 입력해 주세요.'
  const name = kind.prefix + Number(digits)
  if (name !== self && tokens.some((t) => t.name === name)) return '같은 길이가 이미 있어요.'
  return null
}

/**
 * 토대의 길이 하나(크기 판의 크기, 간격 판의 간격, 모서리 판의 모서리, 테두리 판의 굵기)를 고치는 패널. 네 판이 함께 쓴다.
 * 이름은 px 숫자 그대로라서 이름 칸이 따로 없다. 길이를 바꾸면 이름도 그 숫자로 바뀌고, 그것을 가리키던 의미 값(의미 크기, 의미 간격)이 새 이름을 따라간다.
 * 이름과 길이를 따로 고칠 수 있으면 --length-32가 36px인 어긋난 상태가 생긴다.
 */
export function LengthInspector({
  kind,
  token,
  tokens,
  file,
  users,
  uses,
  onOpenComponent,
  onOpenToken,
  onChange,
  onCopy,
}: {
  /** 크기(--length-)나 간격(--gutter-). */
  kind: Kind
  token: Token
  tokens: Token[]
  file: string
  /** 이 길이를 가리키는 의미 값(의미 크기, 의미 간격)들의 변수 이름. */
  users: string[]
  /** 이 길이를 바로 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  onOpenToken: (name: string) => void
  /** 길이를 바꾼다. 이름(앞머리 + 숫자)과 값(숫자px)을 함께 받는다. */
  onChange: (name: string, value: string) => void
  onCopy: (text: string) => void
}) {
  const saved = String(parseFloat(token.value))
  const [digits, setDigits] = useState(saved)
  const [error, setError] = useState<string | null>(null)

  function commit(next: string) {
    // 비운 채로 떠나면 저장된 값으로 돌아간다. 빈 칸으로 남겨 두지 않는다.
    if (!next.trim()) {
      setDigits(saved)
      return setError(null)
    }
    const problem = lengthProblem(kind, next, tokens, token.name)
    setError(problem)
    if (problem || Number(next) === Number(saved)) return
    onChange(kind.prefix + Number(next), `${Number(next)}px`)
  }

  const userOf = (name: string) => {
    const user = ALL_KINDS.find((k) => k.matches(name))
    return { short: user ? shortName(user, name) : name, title: user?.title ?? '' }
  }
  const count = users.length + uses.length

  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{lengthLabel(kind, token.name)}</h2>
      </Section>

      <Section title="길이">
        <UnitInput
          label="길이"
          digits={digits}
          unit="px"
          invalid={error !== null}
          placeholder={saved}
          onDigits={(next, typing) => {
            setDigits(next)
            setError(null)
            // 적는 동안은 저장하지 않는다. ↑↓로 올리고 내린 것은 바로 저장한다.
            if (!typing) commit(next)
          }}
          onBlur={() => commit(digits)}
        />
        {error && <span className="mt-label block type-body text-danger">{error}</span>}
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={count > 0 ? String(count) : '없음'} empty={count === 0}>
        {/* 이 길이를 가리키는 의미 값(높이·폭·정사각형, 의미 간격). 누르면 그 판의 그 값으로 간다. 그 아래는 이 길이를 바로 쓰는 컴포넌트다. */}
        <div className="space-y-rows">
          {users.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onOpenToken(name)}
              className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-control px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-focus"
            >
              <span className="truncate">{userOf(name).short}</span>
              <span className="ml-row-inner shrink-0 type-body text-ink-faint">{userOf(name).title}</span>
            </button>
          ))}
          {uses.map((u) => (
            <div key={u.index}>
              <button
                type="button"
                onClick={() => onOpenComponent(u.index)}
                className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-control px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-focus"
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
        <CodeRows uses={[`var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/** 토대의 길이(크기, 간격, 모서리, 테두리)를 만드는 양식. 길이(px)만 받는다. 이름은 그 숫자다(--length-32, --gutter-8, --corner-6, --thickness-1). */
export function NewLengthForm({ kind, tokens, onCreate, onCancel }: { kind: Kind; tokens: Token[]; onCreate: (name: string, value: string) => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = lengthProblem(kind, digits, tokens)
    setError(problem ?? undefined)
    if (problem) return
    onCreate(kind.prefix + Number(digits), `${Number(digits)}px`)
  }

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="길이" error={error}>
        <UnitInput
          label="길이"
          digits={digits}
          unit="px"
          invalid={!!error}
          // 칸이 하나뿐인 창이라 열자마자 길이를 적을 수 있게 한다(다른 추가 창은 이름 칸에 커서가 간다).
          autoFocus
          placeholder={kind.id === 'space' ? '8' : kind.id === 'corner' ? '6' : kind.id === 'thickness' ? '1' : '32'}
          onDigits={(next) => {
            setDigits(next)
            setError(undefined)
          }}
        />
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
