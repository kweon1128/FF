// 크기 판(토대)의 패널과 추가 창, 의미 크기 판의 내용.
// 의미 크기 판은 쓰임마다 이름과 가리키는 크기, 설명, 그 크기가 실제로 쓰인 모습을 보여 준다.

import { SAMPLE_BAR, SAMPLE_W, paints, sampleColors } from './lib/sample'
import { CHECK_STROKE, ICON_STROKE } from './lib/icons'
import { useContext, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Check as CheckIcon, ChevronDown, Copy, Folder, Minus, Plus, X } from 'lucide-react'
import type { Token } from './lib/api'
import { ALL_KINDS, KINDS, SLUG, slugMessage, lengthLabel, shortName, type Kind } from './lib/catalog'
import { resolveColor, type Around } from './lib/roles'
import { SIZE_GROUPS, SIZE_SHAPES, SIZE_NAMES, SIZE_SHAPE_FOR, SIZE_WORDS, guessSizeGroup, isSizeKind, sizeKindOf, isSizeListShape, lengthRefOf, readSizeNote, resolveLength, writeSizeNote, type SizeExample, type SizeGroup, type SizeShape } from './lib/sizes'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, Section, WHERE_OPEN, ICON_BUTTON } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, RowSample, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, Segmented, UnitInput, UsePicker, inputClass, linkRowClass } from './ui'
import { freeName, nearestRef } from './lib/nearest'
import { nameRules, numberRules, unitProps, useField } from './useField'
import { useReorder } from './useReorder'
import { NavIcon, isNavLabel } from './SampleParts'
import { WithExample } from './WithExample'

const LENGTH = KINDS.length

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'
// 크기를 재는 치수선의 색. FF의 안내 색 그대로다. 의미 간격 판의 옅은 띠와 같은 색이지만 모양이 다르다:
// 띠는 비어 있는 자리(여백)를 칠하는 것이고, 크기는 요소 자체의 길이라 그 옆에 선을 그어 잰다. 요소를 색으로 덮으면 무엇의 크기인지가 가려진다.
const MARK = 'var(--color-guide)'

/** 치수선이 차지하는 자리(px): 요소와의 거리 8, 선의 굵기 1, 선 밖으로 나가는 가로대 3. 예시 상자가 선이 놓이는 쪽에 이만큼 여백을 더 둔다. */
const RESERVE = 12
/** 치수선에 적는 값의 이름표. 판을 끌 때 간격을 적는 이름표와 같은 모양이다(안내 색 바탕에 흰 숫자, 높이 16px). 선의 바깥쪽에 4px 띄워 놓는다. */
const TAG = 'rounded-tag bg-guide px-[4px] type-caption-strong whitespace-nowrap text-on-selection tabular-nums!'
const TAG_GAP = 4
const TAG_HEIGHT = 16
/** 이름표의 폭(px)을 어림한 값. 좌우 여백 4씩에 숫자 한 글자가 7쯤이다. 예시 상자의 여백을 정하는 데 쓴다. */
const tagWidth = (text: string) => 8 + 7 * text.length

/** 그림이 예시 칸에 들어가는 가장 큰 길이(px). 이보다 크면 절반씩 줄여 그린다. 폭은 칸이 넓어서 더 크게 잡는다. */
const LIMIT = { height: 200, width: 520, square: 200 }

/**
 * 그 크기를 몇 분의 일로 줄여 그리는지. 줄이지 않으면 1.
 * fit은 예시 칸이 좁은 판(화면 크기 판)에서 그림이 들어가야 하는 폭이다. 주면 그 폭에 맞추고, 16분의 1까지 줄인다.
 */
export function sampleScale(kind: Kind, value: string, fit?: number): number {
  const px = parseFloat(value)
  const limit = fit ?? LIMIT[kind.id as keyof typeof LIMIT] ?? 200
  const steps = fit === undefined ? [1, 2, 4, 8] : [1, 2, 4, 8, 16]
  return steps.find((n) => px / n <= limit) ?? steps[steps.length - 1]
}

/**
 * 크기가 실제로 쓰인 모습. 무엇의 크기인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 재는 것(그 높이, 그 폭)의 옆에 안내 색의 치수선을 긋는다. 선의 길이가 그 값이고 양 끝에 짧은 가로대가 있다(도면에서 길이를 적는 선).
 * 높이는 요소의 왼쪽에 세로선, 폭은 요소의 위에 가로선, 정사각형은 둘 다다. 요소는 칠하지 않는다. 길이는 값 그대로다. 예시 칸보다 큰 것만 통째로 줄여 그리고, 판의 줄이 몇 분의 일인지 적는다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 간격과 다른 크기는 보여 주는 시스템의 값으로 그려진다(PreviewSpaceContext).
 */
export function SizeSample({
  kind,
  shape,
  value,
  fit,
  custom,
  around,
  tint,
  words: written = '',
}: {
  kind: Kind
  shape: SizeShape
  value: string
  /** 그림이 들어가야 하는 폭(px). 예시 칸이 좁은 판에서 준다. */
  fit?: number
  /** 재는 요소를 밖에서 그린다(화면 크기 판의 브레이크포인트와 페이지). fill은 재는 상자를 채우는 클래스이고, scale은 그림을 몇 분의 일로 줄였는지다(글자를 제 크기로 되돌릴 때 쓴다). 치수선과 예시 상자는 여기 것을 그대로 쓴다. */
  custom?: (fill: string, scale: number) => ReactNode
  around: Around
  tint: string
  words?: string
}) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || SIZE_WORDS[shape]
  const list = isSizeListShape(shape)
    ? all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
    : [all]
  const tall = kind.id === 'height'
  const wide = kind.id === 'width'
  const scale = sampleScale(kind, value, fit)
  const TEXT = 'text-sm leading-5'
  const SMALL = 'text-xs leading-4'
  const line = paints(around).line
  const faint = paints(around).filler
  const hover = paints(around).hover
  const soft = paints(around).soft
  const ring = { boxShadow: `inset 0 0 0 1px ${line}` }
  // 재는 것을 채우는 클래스. 재는 방향으로는 재는 상자를 꽉 채운다.
  const F = `relative shrink-0 ${tall ? 'h-full' : wide ? 'w-full' : 'size-full'}`
  // 재지 않는 방향의 크기. 높이를 재는 그림은 폭을, 폭을 재는 그림은 높이를 그 요소의 평소 크기로 둔다.
  const other = (w: string, h: string) => (tall ? w : wide ? h : '')
  const dims: CSSProperties = tall ? { height: value } : wide ? { width: value } : { width: value, height: value }
  // 치수선의 굵기(1px), 요소와의 거리(8px), 끝의 가로대 길이(7px). 줄여 그리는 그림에서도 화면에는 같은 굵기로 보이도록 줄인 만큼 키운다.
  const thick = scale
  const away = 8 * scale + thick
  const cap = 7 * scale
  const capAt = -(cap - thick) / 2
  // 선에 적는 값. 단위 없이 숫자만 적는다(32). 줄여 그리는 그림에서도 실제 값을 적는다.
  const amount = String(parseFloat(value))
  /** 재는 상자. 이 상자의 높이(폭)가 그 값이고, 치수선이 그 옆에 같은 길이로 그어진다. */
  // inset은 재는 상자가 눈에 보이는 요소의 가장자리에서 안쪽으로 들어가 있는 만큼이다(전환 버튼의 칸은 바깥 상자의 안쪽 여백만큼 들어가 있다).
  // 그만큼 선을 더 밖으로 내서, 선과 눈에 보이는 요소 사이가 어느 예시에서나 8px이 되게 한다.
  /** 높이의 치수선과 그 값의 이름표. 재는 것(relative)의 왼쪽에 놓인다. */
  const heightMark = (text: string, inset = 0) => (
    <span data-measure="height" className="pointer-events-none absolute" style={{ top: 0, bottom: 0, left: -away - inset * scale, width: thick, background: MARK }}>
      <span className="absolute" style={{ top: 0, left: capAt, width: cap, height: thick, background: MARK }} />
      <span className="absolute" style={{ bottom: 0, left: capAt, width: cap, height: thick, background: MARK }} />
      {/* 값의 이름표. 선의 한가운데 높이에서 선의 왼쪽에 놓는다. 요소를 가리지 않는다. 줄여 그리는 그림에서도 글자는 제 크기다. 이름표에만 zoom을 되돌린다(자리를 잡는 바깥 상자에 주면 그 거리까지 함께 커진다). */}
      <span className="absolute" style={{ top: '50%', left: -(cap - thick) / 2 - TAG_GAP * scale }}>
        <span data-measure-tag className={`absolute top-0 right-0 -translate-y-1/2 ${TAG}`} style={{ zoom: scale }}>{text}</span>
      </span>
    </span>
  )
  const m = (children: ReactNode, more = '', inset = 0) => (
    <span data-sample className={`relative flex shrink-0 ${more}`} style={{ ...dims, zoom: 1 / scale }}>
      {!wide && heightMark(amount, inset)}
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
  const roomLeft = `calc(var(--spacing-sample) + ${RESERVE + TAG_GAP + tagWidth(amount)}px)`
  const roomTop = `calc(var(--spacing-sample) + ${RESERVE + TAG_GAP + TAG_HEIGHT}px)`
  const frame = (body: ReactNode) => (
    <span
      className={`flex w-full items-center justify-center overflow-hidden rounded-card p-sample ${EDGE}`}
      style={{ ...space, background: around.surface, color: around.ink, fontFamily: font, ...(wide ? {} : { paddingLeft: roomLeft }), ...(tall ? {} : { paddingTop: roomTop }) }}
    >
      {body}
    </span>
  )
  const bar = (more = '') => <span className={`block ${SAMPLE_BAR} rounded-small ${more}`} style={{ background: faint }} />
  const square = (icon: ReactNode) => (
    <span className="flex size-icon-button shrink-0 items-center justify-center rounded-control" style={{ background: hover, color: soft }}>
      {icon}
    </span>
  )
  if (custom) return frame(m(custom(F, scale)))
  switch (shape) {
    case 'input':
      return frame(m(<span className={`${F} ${other(SAMPLE_W, 'h-control')} flex items-center overflow-hidden rounded-control px-input-x whitespace-nowrap ${TEXT}`} style={ring}>{all}</span>))
    case 'button':
      // 나란한 버튼. 마지막은 채운 버튼이다(취소, 추가처럼 끝의 것이 주된 동작이다). 그 앞의 것은 바탕 없는 버튼이라, 마우스를 올린 모습(옅은 바탕)으로 그려 버튼이 어디까지인지 보여 준다. 하나뿐이면 테두리 버튼이다.
      return frame(
        m(
          <span className={`${F} ${other('', 'h-control')} flex items-stretch gap-actions`}>
            {list.map((text, i) => (
              <span
                key={i}
                className={`flex flex-1 items-center justify-center rounded-control font-[550] whitespace-nowrap ${list.length > 1 && i < list.length - 1 ? 'px-button-ghost-x' : 'px-button-x'} ${TEXT}`}
                style={list.length === 1 ? ring : i === list.length - 1 ? { background: paints(around).primary, color: paints(around).onPrimary } : { background: hover }}
              >
                {text}
              </span>
            ))}
          </span>,
        ),
      )
    case 'row':
      // 왼쪽 메뉴의 줄. 지금 열려 있는 화면의 줄이라 옅은 바탕이 깔려 있고 글자가 굵다(16px). 앞에 그 화면의 아이콘이 있다.
      return frame(
        m(
          <span className={`${F} ${other(SAMPLE_W, 'h-row')} flex items-center gap-row-inner overflow-hidden rounded-row px-row-x text-base leading-6 font-[550] whitespace-nowrap`} style={{ background: hover }}>
            <NavIcon label={all} />
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
      return frame(m(<span className={`${F} ${other(SAMPLE_W, 'h-[12px]')} block rounded-pill`} style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />))
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
          <span className={`${F} ${other(SAMPLE_W, 'h-bar')} flex items-center gap-row-inner overflow-hidden px-bar-x font-[550] whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 -1px 0 ${line}` }}>
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
          <span className={`${F} ${other(SAMPLE_W, 'h-compact')} flex items-center justify-between gap-columns font-[550] whitespace-nowrap ${SMALL}`}>
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
        <span className={`block rounded-card ${other(SAMPLE_W, '')}`} style={ring}>
          {m(<span className={`${F} ${other('w-full', 'h-[40px]')} flex items-center px-section-x whitespace-nowrap ${SMALL}`} style={{ color: soft }}>{all}</span>, tall ? 'w-full' : '')}
          <span className="block px-section-x pb-section-y">{bar('w-full')}</span>
        </span>,
      )
    case 'list':
      // 줄이 넘치면 스크롤되는 목록 상자. 재는 것은 상자의 높이(폭)이고, 줄은 그 안에서 잘린다.
      return frame(
        m(
          <span className={`${F} ${other(SAMPLE_W, 'h-[144px]')} block overflow-hidden rounded-card p-box`} style={ring}>
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
      // 메뉴를 실제 모습대로 그린다. 문구가 FF의 화면 이름이면 왼쪽 메뉴다(아이콘과 16px 글자. 첫 줄이 지금 열린 화면).
      // 아니면 떠 있는 메뉴다(디자인 시스템을 고르는 메뉴). 첫 줄이 지금 고른 것이라 오른쪽에 체크가 있고, "새 …"로 시작하는 줄은 만드는 줄이라 앞에 +가 있고 옅다.
      return frame(
        m(
          <span className={`${F} block space-y-rows rounded-float p-menu`} style={ring}>
            {list.map((text, i) => (
              // 줄을 감싼 상자. 첫 줄 옆에 줄 높이의 치수선을 긋는다(줄은 넘치는 것을 자르므로 선을 줄 안에 둘 수 없다). 4는 메뉴 상자의 안쪽 여백이다.
              <span key={i} className="relative block">
                {isNavLabel(list[0]) ? (
                <span className={`flex h-row items-center gap-row-inner overflow-hidden rounded-row px-row-x text-base leading-6 whitespace-nowrap ${i === 0 ? 'font-[550]' : ''}`} style={i === 0 ? { background: hover } : { color: soft }}>
                  <NavIcon label={text} />
                  {text}
                </span>
              ) : (
                <span className={`flex h-row items-center gap-row-inner overflow-hidden rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={(text.startsWith('새 ') || text.endsWith(' 만들기')) ? { color: soft } : undefined}>
                  {(text.startsWith('새 ') || text.endsWith(' 만들기')) && <Plus size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
                  <span className="min-w-0 flex-1">{text}</span>
                  {i === 0 && <CheckIcon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
                </span>
                )}
              </span>
            ))}
          </span>,
        ),
      )
    case 'frame': {
      // 면(패널, 창)을 실제 모습대로 그린다. 문구는 차례대로 제목, 입력칸의 이름표, 아래 버튼들이다("의미 색 추가, 이름, 취소, 추가").
      // 제목이 없는 면(창의 왼쪽 설정 칸)은 제목 자리에 "-"를 적는다. 이름표가 없으면 내용을 막대로 대신 그린다(내용이 정해져 있지 않은 화면).
      // 입력칸은 패널과 기본 창에서는 면의 폭을 다 쓰고, 넓은 창(한 벌 만들기)에서는 왼쪽 설정 칸의 폭(224px)이다.
      const [title, label, ...actions] = list
      return frame(
        m(
          <span className={`${F} ${other(SAMPLE_W, '')} block overflow-hidden rounded-float px-section-x py-section-y`} style={ring}>
            {title && title !== '-' && <span className="mb-header block text-base leading-6 font-[650] whitespace-nowrap">{title}</span>}
            {label ? (
              <span className={`block max-w-full ${parseFloat(value) <= 400 ? 'w-full' : 'w-[224px]'}`}>
                <span className={`mb-label block font-[550] whitespace-nowrap ${TEXT}`} style={{ color: paints(around).faint }}>
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
              <span className="mt-dialog-actions flex justify-end gap-actions">
                {actions.map((text, i) => (
                  <span
                    key={i}
                    className={`flex h-control items-center rounded-control font-[550] whitespace-nowrap ${i === actions.length - 1 ? 'px-button-x' : 'px-button-ghost-x'} ${TEXT}`}
                    style={i === actions.length - 1 ? { background: paints(around).primary, color: paints(around).onPrimary } : { color: soft }}
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
    case 'select': {
      // 고르는 칸. 재는 것은 진하게 적는 이름의 자리이고, 그 옆에 옅은 덧글과 화살표가 놓인다. 문구는 이름, 덧글의 차례다("높이, h-이름").
      // 이름의 자리는 칸의 위쪽 가장자리에서 6px 들어가 있어서(칸 32px에 글자 20px), 치수선을 그만큼 더 밖으로 낸다.
      // 덧글에는 쉼표가 들어갈 수 있어서("카드, 메뉴, 창") 첫 문구만 이름이고 나머지는 모두 덧글이다.
      const [name, ...rest] = list
      const hint = rest.join(', ')
      return frame(
        <span className={`flex h-control w-[224px] items-center gap-row-inner rounded-control px-input-x ${TEXT}`} style={ring}>
          {m(<span className={`${F} ${other('', 'h-[20px]')} font-[550] whitespace-nowrap`}>{name}</span>, '', 6)}
          <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap" style={{ color: soft }}>
            {hint}
          </span>
          <ChevronDown size={16} strokeWidth={ICON_STROKE} className="shrink-0" style={{ color: soft }} />
        </span>,
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
          <span className={`${F} ${other(SAMPLE_W, 'h-[96px]')} flex items-center justify-center rounded-float`} style={ring}>
            <span className={`flex h-control items-center rounded-control px-button-x font-[550] whitespace-nowrap ${TEXT}`} style={{ background: paints(around).primary, color: paints(around).onPrimary }}>
              {all}
            </span>
          </span>,
        ),
      )
    case 'picker':
      return frame(m(<span className={`${F} ${other(SAMPLE_W, 'h-[144px]')} block rounded-card`} style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${tint})` }} />))
    case 'stage':
      // 효과를 얹어 보이는 무대. 막대들이 놓인 면이다.
      return frame(
        m(
          <span className={`${F} ${other(SAMPLE_W, 'h-[80px]')} block overflow-hidden`}>
            {bar('w-3/4')}
            {bar('mt-blocks w-1/2')}
            {bar('mt-blocks w-2/3')}
            {bar('mt-blocks w-1/3')}
          </span>,
        ),
      )
    case 'placeholder':
      return frame(m(<span className={`${F} ${other('w-[96px]', SAMPLE_BAR)} block rounded-small`} style={{ background: faint }} />))
    case 'badge':
      return frame(m(<span className={`${F} ${other('', 'h-compact')} flex items-center justify-center overflow-hidden rounded-pill px-row-x font-[550] whitespace-nowrap ${SMALL}`} style={{ background: hover }}>{all}</span>))
    case 'dot':
      return frame(m(<span className={`${F} block rounded-pill`} style={{ background: around.ink }} />))
    default:
      return frame(m(<span className={`${F} ${other('w-[96px]', 'h-[40px]')} block rounded-card`} style={{ background: faint }} />))
  }
}

/** 같은 길이가 이미 있을 때의 문구. 다 적어야 알 수 있는 오류라서 칸을 벗어날 때에만 알린다. */
const SAME_LENGTH = '같은 길이가 이미 있어요.'

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

/** 판의 줄 앞에 적는, 그 값이 어느 쪽 길이인지. */
const DIMENSION: Record<string, string> = { height: '높이', width: '너비', square: '정사각형' }

type SizeRow = { t: Token; kind: Kind; short: string; group: SizeGroup; text: string; picked?: SizeShape; examples: SizeExample[]; length: string | null; shown: string }

/**
 * 의미 크기 판. 의미 간격 판과 같은 짜임이다: 분류(버튼, 입력칸, 목록 …) 아래에 값이 한 줄씩 놓인다.
 * 높이·너비·정사각형으로 나누지 않는다. 그것은 분류가 아니라 값의 속성(변수 이름의 앞머리)이라 줄 앞에 적는다.
 * 분류 안에서 "요소"(예시의 모양이 같은 값들)로 한 번 더 묶지도 않는다. 분류가 곧 컴포넌트라서 그 단계가 필요 없다.
 * 줄의 순서는 파일의 순서다. 세 종류의 값이 한 줄로 이어져 있어서, 같은 분류 안이면 높이와 너비를 섞어 놓을 수 있다.
 * 분류의 제목을 끌면 분류의 순서가 바뀌고, 줄을 끌면 같은 분류 안에서 순서가 바뀐다. "원래대로"는 분류와 줄을 처음 순서로 돌려놓는다.
 */
export function SizeBoard({
  tokens,
  selected,
  onSelect,
  onSelectGroup,
  onRename,
  onMove,
  onMoveGroup,
}: {
  tokens: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
  /** 줄을 끌어 같은 분류의 값들 사이에서 순서를 바꾼다. */
  onMove?: (name: string, before: string | null) => void
  /** 분류 제목을 끌어 분류의 순서를 바꾼다. */
  onMoveGroup?: (group: SizeGroup, before: SizeGroup | null) => void
}) {
  const rows: SizeRow[] = tokens.flatMap((t) => {
    const kind = sizeKindOf(t)
    if (!kind) return []
    const short = shortName(kind, t.name)
    const { length, shown } = shownOf(tokens, t.value)
    return [{ t, kind, short, ...readSizeNote(t.note, short), length, shown }]
  })
  // 분류는 파일에 처음 나오는 순서대로 놓는다(lib/order.ts의 sizeBoardGroupOrder와 같다). 끌어서 바꾼 순서가 파일에 남는다.
  const groups = [...new Set(rows.map((r) => r.group))].map((id) => SIZE_GROUPS.find((g) => g.id === id)!)
  const groupDrag = useReorder(groups.map((g) => g.id), onMoveGroup && ((name, before) => onMoveGroup(name as SizeGroup, before as SizeGroup | null)), { attr: 'data-size-group', gap: 24 })
  if (rows.length === 0) return null
  const around = sampleColors(tokens)
  // 색 칸과 손잡이를 칠할 색. 이 시스템의 선택 색(없으면 주요 색, 그것도 없으면 글자 색)이다.
  const tinted = tokens.find((t) => t.name === '--color-selection') ?? tokens.find((t) => t.name === '--color-primary')
  const tint = (tinted && resolveColor(tokens, tinted.value)) || around.ink
  return (
    <div className="space-y-groups">
      {groups.map((g) => {
        const list = rows.filter((r) => r.group === g.id)
        return (
          <div key={g.id} data-size-group={g.id} className={`relative ${groupDrag.moving(g.id) ? 'opacity-dragging' : ''}`}>
            {groupDrag.line(g.id)}
            {/* 분류의 제목. 누르면 그 분류의 값이 모두 선택되고, 끌면 분류의 순서가 바뀐다(다른 의미 판의 분류 제목과 같다). */}
            <button
              type="button"
              onClick={(e) => !groupDrag.justDragged() && onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              {...groupDrag.grab(g.id)}
              className={`mb-heading -ml-chip-x block rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus ${onMoveGroup ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {g.label}
            </button>
            <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
              <SizeRows rows={list} around={around} tint={tint} selected={selected} onSelect={onSelect} onRename={onRename} onMove={onMove} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 한 분류의 줄들. 줄마다 왼쪽에 그 값(어느 쪽 길이인지, 이름, 길이, 설명)이 있고 바로 옆에 그 값의 예시가 있다.
 * 줄은 하나씩 고른다(누르면 그 값의 패널이 열리고, 두 번 누르면 이름을 고친다). 끌면 같은 분류 안에서 순서가 바뀐다.
 * 예시는 값마다 따로 그린다. 높이 값은 높이의 치수선만, 너비 값은 너비의 치수선만 긋는다(정사각형은 두 선).
 * 값은 하나씩 따로 만들고 고치는 것이라, 그림 하나가 값 하나를 보여 줘야 추가 창과 패널의 예시와 같다.
 */
function SizeRows({
  rows,
  around,
  tint,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  rows: SizeRow[]
  around: Around
  tint: string
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(rows.map((r) => r.t.name), onMove)
  // 그 값의 그림을 몇 분의 일로 줄여 그렸는지.
  const scaleOf = (r: SizeRow) => (r.length === null || r.examples.length === 0 ? 1 : sampleScale(r.kind, r.length))
  // 값마다 그 값의 예시를 바로 옆에 놓는다. 설명과 그림이 한 줄에 있어야 어느 그림이 어느 값의 것인지 보인다.
  const drawingsOf = (r: SizeRow) =>
    plain || r.length === null
      ? []
      : r.examples.map((e, k) => <SizeSample key={`${r.t.name}:${k}`} kind={r.kind} shape={e.shape} value={r.length!} around={around} tint={tint} words={e.words} />)
  // 그림이 하나라도 있는 분류는 왼쪽 칸의 폭을 정해 두어, 그림들이 같은 자리에서 시작하게 한다.
  const any = rows.some((r) => drawingsOf(r).length > 0)
  return (
    <>
      {rows.map((r) => {
        const isSelected = selected.includes(r.t.name)
        const scale = scaleOf(r)
        const drawings = drawingsOf(r)
        return (
          <button
            key={r.t.name}
            type="button"
            data-size-row
            data-token={r.t.name}
            aria-pressed={isSelected}
            aria-label={`${DIMENSION[r.kind.id]} ${r.short} ${r.shown}`}
            onClick={(e) => !reorder.justDragged() && onSelect(r.t.name, isAdditive(e))}
            onDoubleClick={() => onRename(r.t.name)}
            {...reorder.grab(r.t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(r.t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(r.t.name)}
            {/* 왼쪽은 이름·길이·설명. 그림이 하나라도 있는 분류는 이 칸의 폭을 정해 두어, 그림들이 같은 자리에서 시작하게 한다. */}
            <span className={any ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
              <span className="flex flex-wrap items-baseline gap-x-row-inner">
                <span data-dimension className="type-caption text-ink-faint">
                  {DIMENSION[r.kind.id]}
                </span>
                <span data-name className="min-w-0 type-label break-words">
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
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            {drawings.length > 0 && <span className="block min-w-0 flex-1 space-y-blocks">{drawings}</span>}
            {isSelected && selected.length === 1 && <SelectionLabel name={r.short} value={r.shown} />}
          </button>
        )
      })}
    </>
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
 * 의미 크기 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(가리키는 크기), 분류, 설명, 쓰이는 곳, 코드.
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
  /** 값(가리키는 크기)이나 주석(분류, 설명, 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  const { group, text, picked, words, more } = readSizeNote(token.note, short)
  // 이름 칸. 쓸 수 없는 글자는 적는 중에 알리고 벗어나면 되돌린다. 모양이 틀린 이름과 이 판의 규칙은 벗어날 때 알리고 칸에 남긴다(useField).
  const nameField = useField(nameRules({ saved: short, done: (next) => (/^\d/.test(next) ? '숫자로 시작할 수 없어요.' : tokens.some((t) => t.name === kind.prefix + next) ? '같은 이름이 이미 있어요.' : null), save: (next) => onRename(kind.prefix + next) }))
  const [textDraft, setTextDraft] = useState(text)
  const options = baseOptions(tokens)
  const { ref, length } = shownOf(tokens, token.value)
  const known = ref !== null && options.some((o) => o.id === ref)

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
          value={nameField.draft}
          aria-label="이름"
          data-rename="token"
          onChange={(e) => nameField.type(e.target.value)}
          onBlur={nameField.leave}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {nameField.error && <span className="mt-label block type-body text-danger">{nameField.error}</span>}
      </Section>

      <Section title="가리키는 크기">
        {known ? (
          // 고르는 칸 옆에, 가리키는 값이 그 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다.
          <div className="flex items-center gap-actions-tight">
            <div className="min-w-0 flex-1">
              <UsePicker label="가리키는 크기" options={options} value={ref} nameWidth="w-picker-name-wide" onChange={(next) => onChange({ value: `var(${next})` })} />
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

      <Section title="분류">
        <UsePicker label="분류" options={SIZE_GROUPS} value={group} nameWidth="w-picker-name" onChange={(next) => saveNote({ group: next })} />
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
        <CodeRows uses={[...classesOf(kind, token), `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} valueNote={length ?? undefined} />
      </FoldSection>
    </div>
  )
}

/** 추가 창의 예시 영역에 너비의 그림이 들어가는 가장 큰 길이(px). 영역의 안쪽 너비가 290px쯤이고 예시 상자의 좌우 여백이 12px씩이다. 이보다 넓은 너비는 판에서보다 더 줄여 그리고, 몇 분의 일인지 그림 아래에 적는다. */
const ADD_FIT = 264

/** 의미 크기의 종류. 추가 창에서 나란한 전환 버튼으로 고른다. 선택지가 셋뿐이라 펼치지 않고 한 줄에 다 보인다. */
const SIZE_KINDS: { id: 'height' | 'width' | 'square'; label: string }[] = [
  { id: 'height', label: '높이' },
  { id: 'width', label: '너비' },
  { id: 'square', label: '정사각형' },
]

/**
 * 의미 크기를 만드는 양식. 종류(높이, 폭, 정사각형), 이름, 가리키는 크기, 분류, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 가리키는 크기는 고르지 않은 채로 시작한다. 첫 값을 골라 두면 이름만 적고 만들었을 때 엉뚱한 크기를 가리키는 값이 생긴다.
 * "추가"는 판에 하나뿐이고 종류는 여기서 고른다(효과의 추가가 쓰임을 창 안에서 고르는 것과 같다). start는 처음에 골라 둘 종류다.
 * 예시의 모양을 고르고, 크기를 고르면 판의 줄과 같은 예시를 창 오른쪽의 영역에 보여 준다(WithExample). 고른 모양은 주석에 적힌다(문구는 적지 않아 모양의 기본 문구로 그려진다).
 */
export function NewSizeForm({ start, tokens, onCreate, onCancel }: { start?: Kind; tokens: Token[]; onCreate: (kind: Kind, name: string, value: string, note: string) => void; onCancel: () => void }) {
  const options = baseOptions(tokens)
  const [kindId, setKindId] = useState<'height' | 'width' | 'square'>(start && isSizeKind(start) ? (start.id as 'height' | 'width' | 'square') : 'height')
  const kind = KINDS[kindId]
  const [name, setName] = useState('')
  // 창을 열자마자 예시가 보이게, 가리키는 값은 흔히 쓰는 크기(32px)에 가장 가까운 것을 골라 둔다(DESIGN.md dialog-defaults). 예시를 보며 바꾼다.
  const [ref, setRef] = useState<string | null>(() => nearestRef(tokens, options.map((o) => o.id), 32))
  // 분류는 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [group, setGroup] = useState<SizeGroup | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; ref?: string }>({})
  const baseGroup = group ?? (name.trim() ? guessSizeGroup(name.trim()) : 'input')
  // 예시의 모양. 직접 고르기 전까지는 종류와 분류에 맞는 모양을 따라간다.
  const [picked, setPicked] = useState<SizeShape | null>(null)
  const shape = picked ?? SIZE_SHAPE_FOR[kindId][baseGroup]
  // 이름 칸은 비워 두고, 고른 예시에 맞는 이름을 옅은 글자로 추천한다(DESIGN.md dialog-defaults). 추천은 값이 아니다. 비운 채 추가하면 "이름을 입력해 주세요."다.
  const suggestedName = freeName(tokens, kind.prefix, SIZE_NAMES[shape])
  const shownGroup = baseGroup
  // 고른 크기의 길이와, 판의 줄(SizeList)과 같은 색.
  const length = ref ? resolveLength(tokens, `var(${ref})`) : null
  // 너비는 예시 영역에 들어가게 줄여 그린다. 줄여 그렸으면 판의 줄과 같은 말로 알린다.
  const fit = kindId === 'width' ? ADD_FIT : undefined
  const scale = length !== null ? sampleScale(kind, length, fit) : 1
  const around = sampleColors(tokens)
  const tinted = tokens.find((t) => t.name === '--color-selection') ?? tokens.find((t) => t.name === '--color-primary')
  const tint = (tinted && resolveColor(tokens, tinted.value)) || around.ink

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    if (!n) next.name = '이름을 입력해 주세요.'
    else if (!SLUG.test(n)) next.name = slugMessage(n)
    else if (/^\d/.test(n)) next.name = '숫자로 시작할 수 없어요.'
    else if (tokens.some((t) => t.name === kind.prefix + n)) next.name = '같은 이름이 이미 있어요.'
    if (!ref) next.ref = '크기를 골라 주세요.'
    setError(next)
    if (Object.keys(next).length === 0 && ref) onCreate(kind, kind.prefix + n, `var(${ref})`, writeSizeNote(shownGroup, text, shape))
  }

  // 가리킬 크기가 하나도 없으면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  if (options.length === 0)
    return (
      <div>
        <p className="type-body text-ink-soft">의미 크기는 크기 판의 값을 가리켜요. 크기 판에 값을 먼저 추가해 주세요.</p>
        <div className="mt-dialog-actions flex justify-end">
          <Button autoFocus onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit}>
      <WithExample example={length !== null ? <SizeSample kind={kind} shape={shape} value={length} fit={fit} around={around} tint={tint} /> : null} note={scale > 1 ? `그림은 1/${scale}` : undefined}>
      <Field label="종류" plain>
        <Segmented
          label="종류"
          options={SIZE_KINDS}
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
          // 옅은 글자는 그대로 적으면 만들어지는 이름일 때만 보인다. 이미 있는 이름을 본보기로 보이면, 따라 적었을 때 되는 창과 안 되는 창이 생긴다.
          placeholder={suggestedName}
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
          nameWidth="w-picker-name-wide"
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
      </Field>
      <Field label="분류" plain>
        <UsePicker label="분류" options={SIZE_GROUPS} value={shownGroup} nameWidth="w-picker-name" onChange={setGroup} />
      </Field>
      <Field label="예시" plain>
        <UsePicker label="예시" options={SIZE_SHAPES} value={shape} nameWidth="w-picker-name-long" onChange={setPicked} />
      </Field>
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      </WithExample>
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
  if (name !== self && tokens.some((t) => t.name === name)) return SAME_LENGTH
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
  // 숫자가 아니거나 0 이하인 것은 적는 중에 알리고 벗어나면 되돌린다. 같은 길이인지는 다 적어야 알 수 있어(24를 적으려면 2를 거친다) 벗어날 때 알리고 칸에 남긴다(useField).
  const field = useField(
    numberRules({
      saved,
      positive: true,
      integer: true,
      message: '0보다 큰 정수를 입력해 주세요.',
      done: (next) => lengthProblem(kind, next, tokens, token.name),
      save: (next) => onChange(kind.prefix + next, `${next}px`),
    }),
  )

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
          {...unitProps(field)}
          unit="px"
          placeholder={saved}
        />
        {field.error && <span className="mt-label block type-body text-danger">{field.error}</span>}
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={count > 0 ? String(count) : '없음'} empty={count === 0}>
        {/* 이 길이를 가리키는 의미 값(높이·폭·정사각형, 의미 간격). 누르면 그 판의 그 값으로 간다. 그 아래는 이 길이를 바로 쓰는 컴포넌트다. */}
        <div className="space-y-blocks">
          {users.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onOpenToken(name)}
              className={linkRowClass}
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
        <CodeRows uses={[`var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/**
 * 토대의 길이(크기, 간격, 모서리, 테두리)를 만드는 양식. 길이(px)만 받는다. 이름은 그 숫자다(--length-32, --gutter-8, --corner-6, --thickness-1).
 * 0보다 큰 정수를 적으면 판의 줄과 같은 견본을 창 오른쪽의 영역에 보여 준다(WithExample. 크기는 치수선, 간격은 띠, 모서리는 둥근 모서리 하나, 테두리는 선 하나).
 */
/** 긴 길이를 화면에 대어 볼 때의 모양. 크기는 선·너비·높이, 간격은 위아래·좌우 가운데서 고른다. */
type LengthView = 'line' | 'wide' | 'tall' | 'gapy' | 'gapx'
const LENGTH_VIEWS: { id: LengthView; label: string }[] = [
  { id: 'line', label: '선' },
  { id: 'wide', label: '너비' },
  { id: 'tall', label: '높이' },
]
const SPACE_VIEWS: { id: LengthView; label: string }[] = [
  { id: 'gapy', label: '위아래' },
  { id: 'gapx', label: '좌우' },
]

/**
 * 화면 위에 실제 크기로 그린 길이. 추가 창의 "누르고 있는 동안 화면에 대어 보기"가 띄운다. 누를 수 없고(누르고 있는 버튼이 계속 듣는다), 모든 것 위에 놓인다.
 * 화면보다 긴 길이는 시작하는 쪽(왼쪽, 위)부터 보이고 끝에서 잘린다. 그때는 화면의 크기와 함께 그렇다고 적는다.
 * 선은 판의 치수선과 같은 안내 색이고, 면은 FF의 면(흰 바탕과 1px 선)이다. 간격은 두 면 사이에 안내 색을 옅게 칠한 띠로 그린다(판의 간격 예시와 같다).
 */
function LengthOnScreen({ px, view }: { px: number; view: LengthView }) {
  const across = view === 'line' || view === 'wide' || view === 'gapx'
  const over = across ? px > window.innerWidth : px > window.innerHeight
  const face = 'shrink-0 rounded-float border-edge border-hairline bg-canvas'
  const band = { background: 'color-mix(in oklab, var(--color-guide) 30%, transparent)' }
  const tag = <span className="rounded-tag bg-guide px-[4px] type-caption-strong whitespace-nowrap text-on-selection tabular-nums!">{px}</span>
  return (
    <div data-length-on-screen className="pointer-events-none fixed inset-0 z-listbox flex overflow-hidden bg-canvas/90" style={{ justifyContent: 'safe center', alignItems: 'safe center' }}>
      <p className="absolute inset-x-0 top-[16px] text-center type-caption text-ink-faint">
        {px}px{over && ` · 화면(${across ? window.innerWidth : window.innerHeight}px)보다 길어서 끝이 잘려요`}
      </p>
      {view === 'line' && <RowSample kind={KINDS.length} value={`${px}px`} />}
      {view === 'wide' && (
        <div className={`flex items-center justify-center ${face}`} style={{ width: px, height: 320 }}>
          {tag}
        </div>
      )}
      {view === 'tall' && (
        <div className={`flex items-center justify-center ${face}`} style={{ width: 320, height: px }}>
          {tag}
        </div>
      )}
      {view === 'gapy' && (
        <div className="flex shrink-0 flex-col">
          <div className={face} style={{ width: 320, height: 64 }} />
          <div className="flex items-center justify-center" style={{ ...band, height: px }}>
            {tag}
          </div>
          <div className={face} style={{ width: 320, height: 64 }} />
        </div>
      )}
      {view === 'gapx' && (
        <div className="flex shrink-0">
          <div className={face} style={{ width: 64, height: 240 }} />
          <div className="flex items-center justify-center" style={{ ...band, width: px }}>
            {tag}
          </div>
          <div className={face} style={{ width: 64, height: 240 }} />
        </div>
      )}
    </div>
  )
}

export function NewLengthForm({ kind, tokens, onCreate, onCancel }: { kind: Kind; tokens: Token[]; onCreate: (name: string, value: string) => void; onCancel: () => void }) {
  // 창을 열자마자 예시가 보이게, 아직 없는 길이를 채워 둔다. 그 종류가 흔히 밟는 걸음(간격 4, 크기 8, 모서리 2, 테두리 1)의 배수 가운데 아직 없는 가장 작은 값이다.
  // 이미 있는 길이를 채워 두면 그대로 추가했을 때 "같은 길이가 이미 있어요."가 된다. 가장 큰 길이의 다음으로 잡지 않는 것은 9999px(알약 모서리) 같은 값이 섞여 있기 때문이다.
  const [digits, setDigits] = useState(() => {
    const have = new Set(tokens.filter((t) => kind.matches(t.name)).map((t) => parseFloat(t.value)))
    const step = kind.id === 'space' ? 4 : kind.id === 'corner' ? 2 : kind.id === 'thickness' ? 1 : 8
    let next = step
    while (have.has(next)) next += step
    return String(next)
  })
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = lengthProblem(kind, digits, tokens)
    setError(problem ?? undefined)
    if (problem) return
    onCreate(kind.prefix + Number(digits), `${Number(digits)}px`)
  }
  // 예시로 그릴 길이. 적은 것이 0보다 큰 정수일 때만 있다.
  const px = DIGITS.test(digits) && Number.isInteger(Number(digits)) && Number(digits) > 0 ? Number(digits) : null
  // 예시 영역에 실제 크기로 들어가지 않는 길이는 그리지 않고 그렇다고 알린다. 줄여 그리지 않는다.
  // 줄인 그림은 실제 크기가 아니라서 길이의 감을 주지 못하고, 끝에서 자른 그림은 2000과 3000이 똑같이 보인다. 보여 줄 수 없으면 보여 줄 수 없다고 말하는 편이 낫다.
  // 길이가 그대로 그림의 크기가 되는 종류만 해당한다. 크기는 선의 너비(들어갈 자리 256px), 간격은 띠의 높이(200px)다. 모서리와 테두리는 정해진 상자 안에 그려져 넘치지 않는다.
  // 테두리도 굵기가 그대로 선의 높이라 큰 값은 넘친다(모서리만 정해진 상자 안에 그려진다).
  const room = kind.id === 'length' ? 256 : kind.id === 'corner' ? Infinity : 200
  // 화면에 대어 보는 것은 크기와 간격에만 둔다. 화면에 대어 볼 만큼 굵은 테두리는 없다.
  const canHold = kind.id === 'length' || kind.id === 'space'
  const tooBig = px !== null && px > room
  // 예시 영역에 못 그리는 긴 길이는 버튼을 누르고 있는 동안만 화면 위에 실제 크기로 대어 본다(자동으로 띄우지 않는다. 1440을 적으려면 1, 14, 144를 거치는데 그때마다 선이 화면으로 튀어나온다).
  // 무엇으로 볼지도 고른다. 같은 720px라도 선 하나로 볼 때와 그 너비의 면으로 볼 때의 감이 다르다.
  const views = kind.id === 'space' ? SPACE_VIEWS : LENGTH_VIEWS
  const [view, setView] = useState<LengthView>(views[0].id)
  const [holding, setHolding] = useState(false)
  const example =
    px === null ? null : tooBig ? (
      <div data-example-note className="flex flex-col items-center gap-fields">
        <p className="text-center type-body text-ink-faint">
          예시로 그리기에는 너무 큰 길이예요.
          <br />
          값은 적은 그대로 만들어져요.
        </p>
        {canHold && <Segmented label="볼 모양" options={views} value={view} fit onChange={setView} />}
        {canHold && <Button
          // 누르고 있는 동안만 보인다. 손을 떼거나 초점이 떠나면 닫힌다. 자판으로는 스페이스나 Enter를 누르고 있는 동안이다.
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setHolding(true)
          }}
          onPointerUp={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          onKeyDown={(e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return
            // Enter가 창을 내지 않게 한다.
            e.preventDefault()
            setHolding(true)
          }}
          onKeyUp={() => setHolding(false)}
          onBlur={() => setHolding(false)}
        >
          누르고 있는 동안 화면에 대어 보기
        </Button>}
        {holding && createPortal(<LengthOnScreen px={px} view={view} />, document.body)}
      </div>
    ) : (
      // 예시는 좌우 가운데에 둔다. 판의 줄에서는 여러 길이를 견주려고 왼쪽 끝을 맞추지만, 여기서는 하나만 보여서 왼쪽에 붙이면 오른쪽만 비어 덜 만든 것처럼 보인다.
      <span className="flex justify-center overflow-hidden">
        <RowSample kind={kind} value={`${px}px`} />
      </span>
    )

  return (
    <form onSubmit={submit}>
      <WithExample example={example}>
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
      </WithExample>
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
