// 효과(그림자, 투명도, 흐림, 그라데이션) 판의 줄 목록과 예시, 그리고 값을 고치는 패널.
// 의미 색·의미 글꼴 판과 같은 짜임이다. 한 줄에 값 하나, 왼쪽에 이름·값·설명, 오른쪽에 그 값이 쓰인 모습.

import { SAMPLE_BAR, SAMPLE_W } from './lib/sample'
import { ICON_STROKE } from './lib/icons'
import { useContext, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import type { Token } from './lib/api'
import { shortName, type Kind } from './lib/catalog'
import { EFFECT_WORDS, hexOfLayer, nextLayer, paintShadow, parseShadow, rgbOfHex, splitLayers, readEffectNote, writeEffectNote, writeShadow, type EffectKind, type EffectShape, type ShadowLayer } from './lib/effects'
import { DIRECTIONS, addStop, paintGradient, parseGradient, writeGradient, type Gradient, type GradientStop } from './lib/gradient'
import { contrast } from './lib/color'
import { resolveColor, type Around } from './lib/roles'
import { CellsInput } from './ValueBoard'
import { ColorField } from './BoardInspector'
import { RefPicker } from './Roles'
import { paints, sampleColors } from './lib/sample'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, Segmented, UnitInput, UsePicker, inputClass, linkRowClass } from './ui'
import { nameRules, textRules, useField } from './useField'
import { useReorder } from './useReorder'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/**
 * 효과가 실제로 쓰인 모습. 어떤 자리인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 그림자는 그 그림자를 드리운 메뉴·창·알림·카드로, 투명도는 꺼진 버튼이나 화면을 가리는 막으로, 흐림은 뒤가 흐려 보이는 면으로 그린다.
 * 곁에 놓이는 것은 옅은 막대로 그려 자리만 알려 준다. 바탕과 글자 색은 이 디자인 시스템의 것이다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function EffectSample({ shape, value, around, accent, words: written = '' }: { shape: EffectShape; value: string; around: Around; /** 놓일 자리를 알리는 선의 색(이 시스템의 선택 색). */ accent?: string; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || EFFECT_WORDS[shape]
  const faint = paints(around).line
  const bar = (width: string, more = '') => <span className={`block ${SAMPLE_BAR} rounded-small ${width} ${more}`} style={{ background: paints(around).filler }} />
  const STRONG = 'text-sm leading-5 font-[550]'
  // 그림자는 상자 밖으로 지므로, 잘리지 않게 상자 둘레에 24px을 비워 둔다.
  // 내용은 상자의 가운데에 놓는다. 예시는 읽는 글이 아니라 요소 하나를 보여 주는 것이라, 왼쪽에 붙이면 오른쪽만 비어 덜 만든 것처럼 보인다.
  const frame = (body: ReactNode, roomy = false) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-card ${roomy ? 'p-board' : 'p-sample'} ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink, fontFamily: font }}>
      {body}
    </span>
  )
  // 떠 있는 것의 가장자리. 그림자만으로는 흰 바탕 위의 흰 면이 구분되지 않아 옅은 선을 함께 둔다.
  const lifted = { background: around.surface, boxShadow: `${value}, 0 0 0 1px ${faint}` }
  switch (shape) {
    case 'menu':
      return frame(
        <span className={`block ${SAMPLE_W} space-y-rows rounded-float p-menu`} style={lifted}>
          {all
            .split(', ')
            .map((w) => w.trim())
            .filter(Boolean)
            .map((text) => (
              <span key={text} data-sample className="flex h-row items-center rounded-row px-row-x text-sm leading-5 whitespace-nowrap">
                {text}
              </span>
            ))}
        </span>,
        true,
      )
    case 'dialog': {
      // 창을 실제 모습대로 그린다. 문구는 차례대로 제목, 입력칸의 이름표, 아래 버튼들이다("새 디자인 시스템, 이름, 취소, 만들기"). 의미 크기·의미 모서리 판의 창 예시와 같은 규칙이다.
      // 입력칸이 없는 창(확인 창)은 이름표 자리에 "-"를 적는다. 내용을 회색 막대로 대신 그리지 않는다. 버튼은 마지막이 채운 버튼이고 그 앞은 바탕 없는 버튼이다.
      const [title, label, ...actions] = all.split(', ').map((w) => w.trim())
      return frame(
        <span data-sample className="block w-full max-w-[224px] rounded-float p-dialog" style={lifted}>
          <span className="block text-base leading-6 font-[650] break-words">{title}</span>
          {label && label !== '-' && (
            <span className="mt-header block">
              <span className={`mb-label block ${STRONG}`} style={{ color: paints(around).faint }}>
                {label}
              </span>
              <span className="block h-control rounded-control" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }} />
            </span>
          )}
          {actions.length > 0 && (
            <span className="mt-dialog-actions flex justify-end gap-actions">
              {actions.map((text, i) => (
                <span
                  key={i}
                  className={`flex h-control items-center rounded-control whitespace-nowrap ${i === actions.length - 1 ? 'px-button-x' : 'px-button-ghost-x'} ${STRONG}`}
                  style={i === actions.length - 1 ? { background: paints(around).primary, color: paints(around).onPrimary } : { color: paints(around).soft }}
                >
                  {text}
                </span>
              ))}
            </span>
          )}
        </span>,
        true,
      )
    }
    case 'toast':
      return frame(
        <span data-sample className="inline-flex h-control items-center rounded-control px-bar-x text-sm leading-5 whitespace-nowrap" style={{ background: around.ink, color: around.surface, boxShadow: value }}>
          {all}
        </span>,
        true,
      )
    case 'card':
      return frame(
        <span className="block w-full max-w-[224px] rounded-float p-card" style={lifted}>
          <span data-sample className={`block break-words ${STRONG}`}>
            {all}
          </span>
          {bar('w-3/4', 'mt-fields')}
        </span>,
        true,
      )
    case 'sticky': {
      // 스크롤된 내용 위에 붙어 있는 머리. 머리 아래로 그림자가 져서 내용이 그 밑으로 지나가는 것이 보인다. 문구는 머리의 제목과 그 아래 내용의 줄들이다.
      const [title, ...rows] = all.split(', ').map((w) => w.trim())
      return frame(
        <span className={`block ${SAMPLE_W} overflow-hidden rounded-float`} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
          <span data-sample className={`relative z-[1] flex h-bar items-center px-bar-x whitespace-nowrap ${STRONG}`} style={{ background: around.surface, boxShadow: value }}>
            {title}
          </span>
          <span className="block space-y-rows p-menu">
            {rows.map((text, i) => (
              <span key={i} className="flex h-row items-center px-row-x text-sm leading-5 whitespace-nowrap">
                {text}
              </span>
            ))}
          </span>
        </span>,
        true,
      )
    }
    case 'hover': {
      // 같은 버튼을 평소와 마우스를 올렸을 때로 나란히 놓아, 얼마나 옅어지는지 견주어 본다.
      const BUTTON = `flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`
      return frame(
        <span className="flex items-center gap-actions">
          <span className={BUTTON} style={{ background: paints(around).primary, color: paints(around).onPrimary }}>
            {all}
          </span>
          <span data-sample className={BUTTON} style={{ background: paints(around).primary, color: paints(around).onPrimary, opacity: value }}>
            {all}
          </span>
        </span>,
      )
    }
    case 'well':
      // 안쪽 그림자가 지는 입력칸. 칸의 1px 선 안쪽에 그림자가 져서 안으로 들어가 보인다. 문구는 칸에 적힌 말이다.
      return frame(
        <span data-sample className={`flex h-control ${SAMPLE_W} items-center rounded-control px-input-x text-sm leading-5 whitespace-nowrap`} style={{ background: around.surface, boxShadow: `${value}, inset 0 0 0 1px ${faint}` }}>
          {all}
        </span>,
        true,
      )
    case 'drag': {
      // 끌어 옮기는 중인 줄. 목록 상자 안에서 끄는 줄만 옅어지고, 놓일 자리에 선택 색의 선이 그어진다(2px). 첫 문구가 끄는 줄이고, 선은 마지막 줄 아래에 있다.
      const rows = all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
      return frame(
        <span className={`block ${SAMPLE_W} space-y-rows rounded-float p-menu`} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
          {rows.map((text, i) => (
            <span key={i} {...(i === 0 ? { 'data-sample': true } : {})} className={`relative block rounded-row px-board-row-x py-board-row-y whitespace-nowrap ${STRONG}`} style={i === 0 ? { opacity: value } : undefined}>
              {text}
              {rows.length > 1 && i === rows.length - 1 && <span className="pointer-events-none absolute inset-x-0 -bottom-[3px] h-[2px]" style={{ background: accent ?? around.ink }} />}
            </span>
          ))}
        </span>,
      )
    }
    case 'disabled': {
      // 같은 버튼을 켜진 것과 꺼진 것으로 나란히 놓아, 얼마나 옅어지는지 견주어 본다.
      const BUTTON = `flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`
      return frame(
        // 채운 버튼 한 쌍과 테두리 버튼 한 쌍. 쌍끼리는 떨어지지 않게 묶어, 좁은 칸에서는 쌍 단위로 줄이 바뀐다.
        <span className="flex flex-wrap items-center gap-x-columns gap-y-blocks">
          <span className="flex items-center gap-actions">
            <span className={BUTTON} style={{ background: paints(around).primary, color: paints(around).onPrimary }}>
              {all}
            </span>
            <span data-sample className={BUTTON} style={{ background: paints(around).primary, color: paints(around).onPrimary, opacity: value }}>
              {all}
            </span>
          </span>
          <span className="flex items-center gap-actions">
            <span className={BUTTON} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
              {all}
            </span>
            <span className={BUTTON} style={{ boxShadow: `inset 0 0 0 1px ${faint}`, opacity: value }}>
              {all}
            </span>
          </span>
        </span>,
      )
    }
    case 'scrim':
      // 화면(막대들) 위를 이 시스템의 가리는 막 색(scrim)으로 덮고, 그 위에 창을 하나 띄운다.
      return frame(
        <span className="relative block h-[80px] w-full">
          {bar('w-3/4')}
          {bar('w-1/2', 'mt-blocks')}
          {bar('w-2/3', 'mt-blocks')}
          {bar('w-1/3', 'mt-blocks')}
          <span data-sample className="absolute -inset-sample" style={{ background: paints(around).scrim, opacity: value }} />
          <span className="absolute top-1/2 left-1/2 block h-[48px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-card p-box" style={{ background: around.surface }}>
            {bar('w-3/4')}
            {bar('w-1/2', 'mt-blocks')}
          </span>
        </span>,
      )
    case 'fill':
    case 'button': {
      // 그라데이션이 칠해진 면. 바탕은 제목과 설명이 놓인 넓은 면이고, 버튼은 채운 버튼이다.
      // 그 위의 글자는 이 시스템의 글자 색과 바탕 색 가운데 첫 색과 더 잘 구분되는 쪽으로 적는다(어두운 그라데이션 위에는 밝은 글자).
      const first = parseGradient(value)?.stops[0].hex
      const on = first && contrast(first, around.surface) > contrast(first, around.ink) ? around.surface : around.ink
      const [title, text] = all.split(', ').map((w) => w.trim())
      if (shape === 'button')
        return frame(
          <span data-sample className={`flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ backgroundImage: value, color: on }}>
            {title}
          </span>,
        )
      return frame(
        <span data-sample className="flex h-[96px] w-full max-w-[224px] flex-col justify-end rounded-card p-card" style={{ backgroundImage: value, color: on }}>
          <span className="block text-base leading-6 font-[650] break-words">{title}</span>
          {text && <span className="block text-sm leading-5 break-words">{text}</span>}
        </span>,
      )
    }
    case 'bar': {
      // 내용 위에 떠 있는 반투명 상단 바. 그 아래로 지나가는 글이 이 흐림만큼 흐려 보인다. 문구는 막대의 제목과 그 아래 내용의 줄들이다.
      const [title, ...rows] = all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
      return frame(
        <span className={`relative block h-[96px] ${SAMPLE_W} overflow-hidden rounded-card`} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
          {/* 첫 줄이 막대 아래에 반쯤 걸려 있어야 흐려진 것이 보인다. */}
          <span className="block space-y-rows px-row-x pt-[20px]">
            {rows.map((text, i) => (
              <span key={i} className="block text-sm leading-5 whitespace-nowrap">
                {text}
              </span>
            ))}
          </span>
          <span data-sample className={`absolute inset-x-0 top-0 flex h-control items-center px-row-x whitespace-nowrap ${STRONG}`} style={{ background: `color-mix(in oklab, ${around.surface} 60%, transparent)`, backdropFilter: `blur(${value})`, boxShadow: `inset 0 -1px 0 ${faint}` }}>
            {title}
          </span>
        </span>,
      )
    }
    case 'glass':
      // 뒤에 놓인 것이 얼마나 흐려지는지. 왼쪽은 그대로, 오른쪽은 흐려진 것이다.
      return frame(
        <span className="flex items-center gap-columns">
          {[undefined, `blur(${value})`].map((filter, i) => (
            <span key={i} {...(filter ? { 'data-sample': true } : {})} className="block w-[96px] space-y-blocks" style={{ filter }}>
              <span className={`block ${SAMPLE_BAR} w-full rounded-small`} style={{ background: around.ink }} />
              <span className={`block ${SAMPLE_BAR} w-2/3 rounded-small`} style={{ background: around.ink }} />
              <span className={`block ${SAMPLE_BAR} w-3/4 rounded-small`} style={{ background: around.ink }} />
            </span>
          ))}
        </span>,
      )
    default:
      // 겹침: 막대들 위에 이 시스템의 글자 색 면을 이 투명도로 겹친다.
      return frame(
        <span className="relative block h-[48px] w-full">
          {bar('w-3/4')}
          {bar('w-1/2', 'mt-blocks')}
          {bar('w-2/3', 'mt-blocks')}
          <span data-sample className="absolute inset-y-0 left-[16px] w-[96px] rounded-card" style={{ background: around.ink, opacity: value }} />
        </span>,
      )
  }
}

/** 판에 적는 값. 투명도는 0.4를 40%로 적는다. 사람이 읽는 것은 퍼센트이기 때문이다. */
const shownValue = (kind: EffectKind, value: string) => {
  const n = Number(value)
  return kind === 'opacity' && value.trim() !== '' && Number.isFinite(n) ? `${Math.round(n * 1000) / 10}%` : value
}

/**
 * 효과 판의 내용. 한 줄에 값 하나. 왼쪽 칸(224px)에 이름, 값, 설명이 있고 오른쪽에 그 값이 쓰인 모습이 있다.
 * 이름과 값은 자르지 않는다(말줄임표를 쓰지 않는다). 그림자 값은 길어서 칸 안에서 줄을 바꿔 다 보여 준다.
 */
export function EffectList({
  kind,
  items,
  all,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  kind: Kind
  items: Token[]
  /** 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 효과는 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(items.map((t) => t.name), onMove)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const id = kind.id as EffectKind
  const around = sampleColors(all)
  const accent = around.selection
  return (
    <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const { text, shape, words, more } = readEffectNote(id, t.note, short)
        const isSelected = selected.includes(t.name)
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            <span className={plain ? 'min-w-0 flex-1' : 'w-row-name shrink-0'}>
              <span data-name className="block type-label break-words">
                {short}
              </span>
              {/* 그림자는 겹마다 한 줄씩 적는다. 칸의 폭에서 아무 데서나 줄이 바뀌면 한 겹의 숫자들이 두 줄로 갈라져 읽기 어렵다. */}
              {id === 'shadow' ? (
                splitLayers(t.value).map((layer, k, list) => (
                  <span key={k} className="block type-code-sm break-words text-ink-faint">
                    {layer}
                    {k < list.length - 1 ? ',' : ''}
                  </span>
                ))
              ) : (
                <span className="block type-code-sm break-words text-ink-faint">{shownValue(id, t.value)}</span>
              )}
              {!plain && text && (
                <span className="mt-label block type-caption break-words text-ink-faint">
                  <Phrases text={text} />
                </span>
              )}
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            <span className={`min-w-0 flex-1 space-y-blocks ${plain ? 'hidden' : 'block'}`}>
              {!plain && [{ shape, words }, ...more].map((e, k) => (
                // 색상 판의 값을 가리키는 그림자는 이 시스템의 그 색으로 바꿔 그린다. 그대로 두면 var()가 FF 자신의 색을 읽는다.
                <EffectSample key={k} shape={e.shape} value={id === 'shadow' ? paintShadow(t.value, (name) => resolveColor(all, `var(${name})`)) : id === 'gradient' ? paintGradient(t.value, (name) => resolveColor(all, `var(${name})`)?.slice(0, 7) ?? null) : t.value} around={around} accent={accent} words={e.words} />
              ))}
            </span>
            {/* 그림자 값은 길어서 이름표에 적지 않는다. */}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={id === 'shadow' || id === 'gradient' ? undefined : shownValue(id, t.value)} />}
          </button>
        )
      })}
    </div>
  )
}

/** 칸에 적는 숫자로 바꾼다. 0.06 → 6(%). */
const digitsOf = (n: number) => String(Math.round(n * 1000) / 1000)
const NUMBER = /^-?\d*\.?\d+$/
/** 숫자를 적는 도중의 꼴("-", "0.", "-."). 아직 숫자는 아니지만 틀린 것도 아니라서 오류로 알리지 않는다. */
const PARTIAL = /^-?\d*\.$|^-$/

/** 그림자 한 겹의 칸들에 적는 중인 숫자. */
type LayerDraft = { x: string; y: string; blur: string; spread: string; alpha: string }
const draftOf = (l: ShadowLayer): LayerDraft => ({ x: digitsOf(l.x), y: digitsOf(l.y), blur: digitsOf(l.blur), spread: digitsOf(l.spread), alpha: l.alpha === null ? '' : digitsOf(l.alpha * 100) })

/**
 * 그림자를 겹마다 고치는 칸들. 겹 하나는 위치(바깥·안쪽), 가로, 세로, 흐림, 퍼짐, 색, 진하기다.
 * 색은 직접 고르거나(견본과 #rrggbb) 색상 판의 값을 가리킨다. 가리키는 색은 색상 판에서 그 색을 바꾸면 따라 바뀐다.
 * 값을 글자로 통째로 적게 하면 "0 4px 16px rgb(0 0 0 / 0.08)"에서 어느 숫자가 무엇인지 외워야 하고, 쉼표 하나를 빠뜨려도 값이 깨진다.
 * 적는 동안은 저장하지 않고 칸을 벗어나거나 Enter를 누를 때 저장한다(↑↓는 바로 저장한다). 칸이 모두 숫자일 때만 저장한다.
 * 숫자가 아닌 것을 적으면 그 칸을 빨갛게 하고 까닭을 적으며, 그대로 벗어나면 저장된 값으로 되돌린다. 비운 칸도 벗어나면 되돌린다.
 * 읽을 수 없는 꼴로 적힌 색(이름, 다른 var())은 색 칸에 옅게 그대로 보여 준다. 색을 새로 고르면 그것으로 바뀌고 진하기 칸이 생긴다.
 */
function ShadowFields({ value, tokens, onChange }: { value: string; /** 색상 판의 값을 고르고, 가리키는 색을 찾을 전체 값 목록. */ tokens: Token[]; onChange: (value: string) => void }) {
  const [layers, setLayers] = useState(() => parseShadow(value) ?? [])
  const [drafts, setDrafts] = useState(() => layers.map(draftOf))
  // "색상 판"을 골랐지만 아직 색을 고르지 않은 겹들. 고르기 전에는 값이 바뀌지 않는다.
  const [picking, setPicking] = useState<number[]>([])
  // 밖에서 값이 바뀌면(되돌리기, 파일을 직접 고침) 칸을 그 값으로 다시 채운다. 여기서 방금 저장한 값이면 그대로 둔다.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== writeShadow(layers)) {
      const next = parseShadow(value) ?? []
      setLayers(next)
      setDrafts(next.map(draftOf))
    }
  }

  /** 칸들이 모두 숫자면 겹으로 읽는다. 하나라도 아니면 null. */
  const read = (base: ShadowLayer, d: LayerDraft): ShadowLayer | null => {
    const fields = [d.x, d.y, d.blur, d.spread, ...(base.alpha === null ? [] : [d.alpha])]
    if (!fields.every((s) => NUMBER.test(s))) return null
    const alpha = base.alpha === null ? null : Math.min(100, Math.max(0, Number(d.alpha))) / 100
    // 흐림은 음수가 될 수 없다.
    return { ...base, x: Number(d.x), y: Number(d.y), blur: Math.max(0, Number(d.blur)), spread: Number(d.spread), alpha }
  }

  function save(nextLayers: ShadowLayer[], nextDrafts: LayerDraft[]) {
    setDrafts(nextDrafts)
    const read_ = nextLayers.map((l, i) => read(l, nextDrafts[i]))
    if (read_.some((l) => l === null)) return
    const done = read_ as ShadowLayer[]
    // 범위를 넘겨 적은 값(진하기 150)은 저장되는 값(100)으로 칸의 글자도 맞춘다.
    setDrafts(done.map(draftOf))
    setLayers(done)
    const written = writeShadow(done)
    setSeen(written)
    if (written !== value) onChange(written)
  }

  /** 숫자가 아닌 것(위치, 색)을 바꾼다. 읽을 수 없던 색을 새로 고르면 진하기 칸이 생기므로 그 칸을 채운다. */
  const change = (i: number, next: Partial<ShadowLayer>) => {
    const nextLayers = layers.map((l, k) => (k === i ? { ...l, ...next } : l))
    const alpha = nextLayers[i].alpha
    const nextDrafts = drafts.map((d, k) => (k === i && alpha !== null && !NUMBER.test(d.alpha) ? { ...d, alpha: digitsOf(alpha * 100) } : d))
    setLayers(nextLayers)
    setPicking(picking.filter((k) => k !== i))
    save(nextLayers, nextDrafts)
  }

  const patch = (i: number, key: keyof LayerDraft, digits: string, typing = false) => {
    const next = drafts.map((d, k) => (k === i ? { ...d, [key]: digits } : d))
    // 자판으로 적는 동안은 칸의 글자만 바꾼다. 28을 적으려면 2를 거치는데, 그 2가 저장되면 그림자가 그사이에 바뀐다.
    if (typing) return setDrafts(next)
    save(layers, next)
  }
  /** 칸을 벗어날 때. 숫자면 저장하고, 비었거나 숫자가 아니면 저장된 값으로 되돌린다. */
  const leave = (i: number, key: keyof LayerDraft) => {
    // 고치지 않은 칸은 저장하지 않는다. 들어갔다 나오기만 해도 저장하면 손으로 적은 그림자의 표기가 FF의 표기로 다시 적힌다.
    if (drafts[i][key] === draftOf(layers[i])[key]) return
    if (NUMBER.test(drafts[i][key])) return save(layers, drafts)
    setDrafts(drafts.map((d, k) => (k === i ? { ...d, [key]: draftOf(layers[i])[key] } : d)))
  }
  /** 숫자가 아닌 것이 적힌 칸. 비운 칸은 틀린 것이 아니라 고치는 중이다. */
  const wrong = (i: number, key: keyof LayerDraft) => drafts[i][key] !== '' && !NUMBER.test(drafts[i][key]) && !PARTIAL.test(drafts[i][key])

  const cell = (i: number, key: keyof LayerDraft, label: string, unit: string, negative = false) => (
    <Field label={label} error={wrong(i, key) ? '숫자를 입력해 주세요.' : null}>
      <UnitInput label={`겹 ${i + 1} ${label}`} digits={drafts[i][key]} unit={unit} negative={negative} invalid={wrong(i, key)} onDigits={(digits, typing) => patch(i, key, digits, typing)} onBlur={() => leave(i, key)} />
    </Field>
  )

  return (
    <div className="space-y-settings">
      {layers.map((l, i) => (
        <div key={i} data-layer={i}>
          {/* 겹이 하나뿐이면 지울 수 없다. 겹이 없는 그림자는 값이 아니다. */}
          <div className="mb-label flex h-control items-center justify-between">
            <p className="type-label">겹 {i + 1}</p>
            {layers.length > 1 && (
              <button
                type="button"
                aria-label={`겹 ${i + 1} 삭제`}
                title={`겹 ${i + 1} 삭제`}
                onClick={() => {
                  const keep = (_: unknown, k: number) => k !== i
                  setPicking([])
                  setLayers(layers.filter(keep))
                  save(layers.filter(keep), drafts.filter(keep))
                }}
                className={ICON_BUTTON}
              >
                <X size={16} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-field-row">
            {/* 바깥은 요소 밖으로 지는 그림자(떠 있는 것), 안쪽은 요소 안으로 지는 그림자(안으로 들어가 보이는 칸)다. */}
            <div className="col-span-2">
              <Field label="위치" plain>
                <Segmented label={`겹 ${i + 1} 위치`} options={SIDES} value={l.inset ? 'in' : 'out'} onChange={(side) => change(i, { inset: side === 'in' })} />
              </Field>
            </div>
            {cell(i, 'x', '가로', 'px', true)}
            {cell(i, 'y', '세로', 'px', true)}
            {cell(i, 'blur', '흐림', 'px')}
            {cell(i, 'spread', '퍼짐', 'px', true)}
            <div className="col-span-2">
              <Field label="색" plain>
                <div className="space-y-blocks">
                  <Segmented
                    label={`겹 ${i + 1} 색 고르는 법`}
                    options={COLOR_FROM}
                    value={l.ref || picking.includes(i) ? 'ref' : 'own'}
                    onChange={(from) => {
                      if (from === 'ref') return setPicking([...picking, i])
                      // 가리키던 색을 풀면 지금 보이는 그 색을 직접 적은 색으로 남긴다.
                      if (!l.ref) return setPicking(picking.filter((k) => k !== i))
                      change(i, { ref: null, rgb: rgbOfHex(resolveColor(tokens, `var(${l.ref})`) ?? '#000000') })
                    }}
                  />
                  {l.ref || picking.includes(i) ? (
                    <RefPicker tokens={tokens} value={l.ref} onChange={(name) => change(i, { ref: name, alpha: l.alpha ?? 1 })} />
                  ) : (
                    <ColorField label={`겹 ${i + 1} 색`} value={hexOfLayer(l)} placeholder={l.alpha === null ? l.color : ''} onCommit={(hex) => change(i, { ref: null, rgb: rgbOfHex(hex), alpha: l.alpha ?? 1 })} />
                  )}
                </div>
              </Field>
            </div>
            {l.alpha !== null && cell(i, 'alpha', '진하기', '%')}
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        aria-label="겹 추가"
        onClick={() => {
          const more = nextLayer(layers)
          setLayers([...layers, more])
          save([...layers, more], [...drafts, draftOf(more)])
        }}
      >
        <Plus size={16} strokeWidth={ICON_STROKE} />겹 추가
      </Button>
    </div>
  )
}

const STOP_AT = {
  cells: [{ label: '위치', unit: '%' }],
  read: (value: string) => (/^\d*\.?\d+$/.test(value) ? [value] : null),
  write: ([n]: number[]) => (n >= 0 && n <= 100 ? String(n) : null),
}

/**
 * 그라데이션을 고치는 칸들. 방향과, 색마다 그 색과 위치(0~100%)다. 색은 그림자와 같이 직접 고르거나 색상 판의 값을 가리킨다.
 * 방향은 여덟 가운데서 고른다. 그 밖의 각도로 적힌 값은 칸 아래에 각도를 그대로 보여 준다. 색은 둘 이상이어야 해서, 둘뿐이면 지울 수 없다.
 */
function GradientFields({ value, tokens, onChange }: { value: string; tokens: Token[]; onChange: (value: string) => void }) {
  const g = parseGradient(value)!
  // "색상 판"을 골랐지만 아직 색을 고르지 않은 색들. 고르기 전에는 값이 바뀌지 않는다.
  const [picking, setPicking] = useState<number[]>([])
  const save = (next: Gradient) => {
    setPicking([])
    onChange(writeGradient(next))
  }
  const setStop = (i: number, next: Partial<GradientStop>) => save({ ...g, stops: g.stops.map((s, k) => (k === i ? { ...s, ...next } : s)) })
  const direction = DIRECTIONS.find((d) => Number(d.id) === ((g.angle % 360) + 360) % 360)
  return (
    <div className="space-y-settings">
      <Field label="방향" plain hint={direction ? undefined : `${g.angle}deg`}>
        <UsePicker label="방향" options={DIRECTIONS} value={direction?.id ?? null} nameWidth="w-picker-name-long" onChange={(id) => save({ ...g, angle: Number(id) })} />
      </Field>
      {g.stops.map((s, i) => (
        <div key={i} data-stop={i}>
          <div className="mb-label flex h-control items-center justify-between">
            <p className="type-label">색 {i + 1}</p>
            {g.stops.length > 2 && (
              <button type="button" aria-label={`색 ${i + 1} 삭제`} title={`색 ${i + 1} 삭제`} onClick={() => save({ ...g, stops: g.stops.filter((_, k) => k !== i) })} className={ICON_BUTTON}>
                <X size={16} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-field-row">
            <div className="col-span-2 space-y-blocks">
              <Segmented
                label={`색 ${i + 1} 고르는 법`}
                options={COLOR_FROM}
                value={s.ref || picking.includes(i) ? 'ref' : 'own'}
                onChange={(from) => {
                  if (from === 'ref') return setPicking([...picking, i])
                  // 가리키던 색을 풀면 지금 보이는 그 색을 직접 적은 색으로 남긴다.
                  if (!s.ref) return setPicking(picking.filter((k) => k !== i))
                  setStop(i, { ref: null, hex: resolveColor(tokens, `var(${s.ref})`)?.slice(0, 7) ?? '#000000' })
                }}
              />
              {s.ref || picking.includes(i) ? <RefPicker tokens={tokens} value={s.ref} onChange={(name) => setStop(i, { ref: name })} /> : <ColorField label={`색 ${i + 1}`} value={s.hex} placeholder="" onCommit={(hex) => setStop(i, { ref: null, hex })} />}
            </div>
            <Field label="위치">
              <CellsInput spec={STOP_AT} value={String(s.at)} onValue={(at) => setStop(i, { at: Number(at) })} />
            </Field>
          </div>
        </div>
      ))}
      <Button variant="ghost" aria-label="색 추가" onClick={() => save(addStop(g))}>
        <Plus size={16} strokeWidth={ICON_STROKE} />색 추가
      </Button>
    </div>
  )
}

const SIDES: { id: 'out' | 'in'; label: string }[] = [
  { id: 'out', label: '바깥' },
  { id: 'in', label: '안쪽' },
]
const COLOR_FROM: { id: 'own' | 'ref'; label: string }[] = [
  { id: 'own', label: '직접' },
  { id: 'ref', label: '색상 판' },
]

/**
 * 숫자 하나로 된 값(투명도는 퍼센트, 흐림은 px)을 고치는 칸.
 * 적는 동안은 저장하지 않고 칸을 벗어나거나 Enter를 누를 때 저장한다(↑↓는 바로 저장한다).
 * 숫자가 아닌 것을 적으면 빨갛게 하고 까닭을 적으며, 그대로 벗어나면 저장된 값으로 되돌린다. 비운 칸도 벗어나면 되돌린다.
 */
function NumberField({ label, unit, value, toDigits, fromDigits, onChange }: { label: string; unit: string; value: string; toDigits: (value: string) => string; fromDigits: (digits: string) => string; onChange: (value: string) => void }) {
  const [digits, setDigits] = useState(() => toDigits(value))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (!NUMBER.test(digits) || fromDigits(digits) !== value) setDigits(toDigits(value))
  }
  const wrong = digits !== '' && !NUMBER.test(digits) && !PARTIAL.test(digits)
  function save(next: string) {
    const written = fromDigits(next)
    setSeen(written)
    // 범위를 넘겨 적은 값(투명도 150)은 저장되는 값(100)으로 칸도 맞춘다.
    setDigits(toDigits(written))
    if (written !== value) onChange(written)
  }
  return (
    <>
      <UnitInput
        label={label}
        digits={digits}
        unit={unit}
        invalid={wrong}
        onDigits={(next, typing) => {
          setDigits(next)
          if (!typing && NUMBER.test(next)) save(next)
        }}
        // 고치지 않은 칸은 저장하지 않는다. 들어갔다 나오기만 해도 저장하면 파일의 표기(.5, 4.0px)가 FF의 표기로 바뀐다(DESIGN.md field-rules).
        onBlur={() => (!NUMBER.test(digits) ? setDigits(toDigits(value)) : digits !== toDigits(value) ? save(digits) : undefined)}
      />
      {wrong && <span className="mt-label block type-body text-danger">숫자를 입력해 주세요.</span>}
    </>
  )
}

/**
 * 효과 값 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값, 설명, 쓰이는 곳, 코드.
 * 예시는 여기서 고치지 않는다. 그 값이 화면 어디에 어떤 말로 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function EffectInspector({
  token,
  tokens,
  kind,
  allNames,
  file,
  uses,
  onOpenComponent,
  onRename,
  onChange,
  onCopy,
}: {
  token: Token
  /** 그림자의 색을 색상 판에서 고를 때 쓰는 전체 값 목록. */
  tokens: Token[]
  kind: Kind
  allNames: string[]
  file: string
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  onRename: (next: string) => void
  /** 값이나 주석(설명과 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const id = kind.id as EffectKind
  const short = shortName(kind, token.name)
  const { text, picked, words, more } = readEffectNote(id, token.note, short)
  // 이름 칸. 쓸 수 없는 글자는 적는 중에 알리고 벗어나면 되돌린다. 모양이 틀린 이름과 이 판의 규칙은 벗어날 때 알리고 칸에 남긴다(useField).
  const nameField = useField(nameRules({ saved: short, done: (next) => (allNames.includes(kind.prefix + next) ? '같은 이름이 이미 있어요.' : null), save: (next) => onRename(kind.prefix + next) }))
  const [textDraft, setTextDraft] = useState(text)
  const rawField = useField(textRules({ saved: token.value, save: (value) => onChange({ value }) }))
  // 겹으로 읽을 수 있는 그림자인지. 읽을 수 없으면(none, var() 등) 글자로 고친다.
  const layered = id === 'shadow' && parseShadow(token.value) !== null
  // 방향과 색들로 읽을 수 있는 그라데이션인지. 읽을 수 없으면(둥근 그라데이션 등) 글자로 고친다.
  const graded = id === 'gradient' && parseGradient(token.value) !== null

  function commitText() {
    // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
    if (textDraft.trim() !== text) onChange({ note: writeEffectNote(id, textDraft, picked, words, more) })
  }

  // 코드에서 쓰는 클래스. Tailwind가 --shadow-, --opacity-, --blur- 값마다 같은 이름의 클래스를 만든다.
  const className = id === 'gradient' ? `bg-${short}` : `${id}-${short}`

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

      <Section title={kind.title}>
        {graded ? (
          <GradientFields value={token.value} tokens={tokens} onChange={(value) => onChange({ value })} />
        ) : layered ? (
          <ShadowFields value={token.value} tokens={tokens} onChange={(value) => onChange({ value })} />
        ) : id === 'opacity' ? (
          <NumberField label="투명도" unit="%" value={token.value} toDigits={(v) => digitsOf(Number(v) * 100)} fromDigits={(d) => String(Math.min(100, Math.max(0, Number(d))) / 100)} onChange={(value) => onChange({ value })} />
        ) : id === 'blur' && /^\d*\.?\d+px$/.test(token.value) ? (
          <NumberField label="흐림" unit="px" value={token.value} toDigits={(v) => v.replace(/px$/, '')} fromDigits={(d) => `${Math.max(0, Number(d))}px`} onChange={(value) => onChange({ value })} />
        ) : (
          <input
            aria-label={kind.valueLabel}
            className={inputClass}
            value={rawField.draft}
            onChange={(e) => rawField.type(e.target.value)}
            // 비웠거나 파일을 깨뜨리는 기호가 든 채로 벗어나면 저장된 값으로 돌아간다(useField).
            onBlur={rawField.leave}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        )}
        {/* 글자로 적는 값의 기호 검사는 어느 패널이나 같다. 적는 중에 알리고, 그대로 벗어나면 되돌린다. */}
        {!layered && !graded && id !== 'opacity' && !(id === 'blur' && /^\d*\.?\d+px$/.test(token.value)) && rawField.error && (
          <span className="mt-label block type-body text-danger">{rawField.error}</span>
        )}
      </Section>

      <Section title="설명">
        <input className={inputClass} aria-label="설명" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={commitText} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
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
        <CodeRows uses={[className, `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/**
 * 추가 창이 쓰는 값 칸. 패널의 값 구역과 같은 칸이다(그림자는 겹들, 그라데이션은 방향과 색들, 투명도는 %, 흐림은 px).
 * 추가 창의 값은 쓰임마다의 추천 값에서 시작하므로 언제나 이 칸들로 읽을 수 있다. 읽을 수 없는 값이면 아무것도 그리지 않는다.
 */
export function EffectValueFields({ id, value, tokens, onChange }: { id: EffectKind; value: string; tokens: Token[]; onChange: (value: string) => void }) {
  if (id === 'shadow') return parseShadow(value) ? <ShadowFields value={value} tokens={tokens} onChange={onChange} /> : null
  if (id === 'gradient') return parseGradient(value) ? <GradientFields value={value} tokens={tokens} onChange={onChange} /> : null
  if (id === 'opacity') return <NumberField label="투명도" unit="%" value={value} toDigits={(v) => digitsOf(Number(v) * 100)} fromDigits={(d) => String(Math.min(100, Math.max(0, Number(d))) / 100)} onChange={onChange} />
  return /^\d*\.?\d+px$/.test(value) ? <NumberField label="흐림" unit="px" value={value} toDigits={(v) => v.replace(/px$/, '')} fromDigits={(d) => `${Math.max(0, Number(d))}px`} onChange={onChange} /> : null
}
