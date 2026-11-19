// 의미 모서리 판의 내용과 패널, 추가 창.
// 의미 크기 판과 같은 짜임이다. 묶음마다 한 줄에 값 하나, 왼쪽에 이름·가리키는 둥글기·설명, 오른쪽에 그 둥글기가 쓰인 모습.
// 토대(모서리 판)의 패널과 추가 창은 크기·간격과 함께 쓴다(Sizes.tsx의 LengthInspector, NewLengthForm).

import { SAMPLE_BAR, SAMPLE_W } from './lib/sample'
import { CHECK_STROKE, ICON_STROKE } from './lib/icons'
import { useContext, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, Check as CheckIcon, Plus, X } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, lengthLabel, shortName, type Kind } from './lib/catalog'
import {
  RADIUS_GROUPS,
  RADIUS_WORDS,
  cornerRefOf,
  guessRadiusGroup,
  isRadiusListShape,
  readRadiusNote,
  resolveCorner,
  writeRadiusNote,
  type RadiusExample,
  type RadiusGroup,
  type RadiusShape,
} from './lib/radius'
import { sampleColors, type SampleColors } from './lib/sample'
import { NavRows } from './SampleParts'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass } from './ui'
import { useReorder } from './useReorder'

const CORNER = KINDS.corner

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/**
 * 둥글기가 실제로 쓰인 모습. 어떤 요소인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 빈 상자가 아니라 그 둥글기를 쓰는 요소(이름표, 체크박스, 버튼, 입력칸, 줄, 메뉴, 창…)를 실제 크기와 실제 모습으로 그린다. 둥글기는 클래스가 아니라 값 그대로 넣는다.
 * 버튼은 버튼으로, 입력칸은 입력칸으로 그린다. 옅은 막대는 곁에 놓이는 것의 자리만 알릴 때 쓰고, 보여 주려는 요소나 버튼을 막대와 빈 상자로 대신하지 않는다.
 * 색은 이 디자인 시스템의 것이다(테두리, 마우스를 올린 바탕, 주요 버튼, 선택 색, 안내 색). shadow는 떠 있는 것에 드리울 그림자(그 시스템의 값. 없으면 드리우지 않는다)다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function RadiusSample({ shape, value, colors: c, shadow, words: written = '' }: { shape: RadiusShape; value: string; colors: SampleColors; shadow?: string; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || RADIUS_WORDS[shape]
  const list = isRadiusListShape(shape)
    ? all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
    : [all]
  const TEXT = 'text-sm leading-5'
  const SMALL = 'text-xs leading-4'
  const STRONG = 'text-sm leading-5 font-[550]'
  const ring = { boxShadow: `inset 0 0 0 1px ${c.line}` }
  const round = { borderRadius: value }
  const bar = (width: string, more = '') => <span className={`block ${SAMPLE_BAR} rounded-small ${width} ${more}`} style={{ background: c.filler }} />
  // 떠 있는 것(메뉴, 창)의 가장자리: 테두리 1px과 그 시스템의 그림자.
  const lifted = { background: c.surface, boxShadow: [`inset 0 0 0 1px ${c.line}`, shadow].filter(Boolean).join(', ') }
  // 내용은 상자의 가운데에 놓는다(효과 판과 같다). 예시는 읽는 글이 아니라 요소 하나를 보여 주는 것이다. 그림자를 드리우는 것은 잘리지 않게 둘레를 넓게 비운다.
  const frame = (body: ReactNode, roomy = false) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-card ${roomy ? 'p-board' : 'p-sample'} ${EDGE}`} style={{ ...space, background: c.surface, color: c.ink, fontFamily: font }}>
      {body}
    </span>
  )
  switch (shape) {
    case 'tag': {
      // 치수선의 숫자 이름표. 안내 색의 선 위에 4px 띄워 놓인다(크기 판과 의미 크기 판의 치수선과 같다). 문구가 숫자면 선의 길이가 그 값이다.
      const n = parseFloat(all)
      const width = Number.isFinite(n) && n >= 8 && n <= 200 ? n : 48
      return frame(
        <span className="block pt-[20px]">
          <span className="relative block h-[7px]" style={{ width }}>
            <span className="absolute inset-x-0 top-[3px] h-px" style={{ background: c.guide }} />
            <span className="absolute top-0 left-0 h-full w-px" style={{ background: c.guide }} />
            <span className="absolute top-0 right-0 h-full w-px" style={{ background: c.guide }} />
            <span data-sample className={`absolute bottom-full left-1/2 mb-[4px] -translate-x-1/2 px-[4px] font-[550] whitespace-nowrap tabular-nums ${SMALL}`} style={{ ...round, background: c.guide, color: c.onSelection }}>
              {all}
            </span>
          </span>
        </span>,
      )
    }
    case 'seltag': {
      // 고른 것 아래에 붙는 이름표. 선택 색이다. 고른 것에는 1px 선택 선과 네 꼭짓점의 사각형이 있고, 이름표는 그 아래 8px에 가운데로 놓인다. 문구는 "이름 · 값"이고 고른 줄에는 이름을 적는다.
      const handle = 'absolute block size-[7px]'
      const knob = { background: c.surface, boxShadow: `inset 0 0 0 1px ${c.selection}` }
      return frame(
        <span className="block pb-[24px]">
          <span className={`relative flex h-row w-[112px] items-center px-board-row-x whitespace-nowrap ${STRONG}`} style={{ boxShadow: `inset 0 0 0 1px ${c.selection}` }}>
            {all.split(' · ')[0]}
            <span className={`${handle} -top-[3px] -left-[3px]`} style={knob} />
            <span className={`${handle} -top-[3px] -right-[3px]`} style={knob} />
            <span className={`${handle} -bottom-[3px] -left-[3px]`} style={knob} />
            <span className={`${handle} -right-[3px] -bottom-[3px]`} style={knob} />
            <span data-sample className={`absolute top-full left-1/2 mt-blocks -translate-x-1/2 px-chip-x font-[550] whitespace-nowrap ${SMALL}`} style={{ ...round, background: c.selection, color: c.onSelection }}>
              {all}
            </span>
          </span>
        </span>,
      )
    }
    case 'check':
      // 켜진 체크 상자와 그 옆의 글자.
      return frame(
        <span className={`flex min-w-0 items-start gap-row-inner ${TEXT}`}>
          <span className="flex h-[20px] shrink-0 items-center">
            <span data-sample className="flex size-checkbox items-center justify-center" style={{ ...round, background: c.ink, color: c.onPrimary }}>
              <CheckIcon size={12} strokeWidth={CHECK_STROKE} />
            </span>
          </span>
          <span className="min-w-0 break-words">{all}</span>
        </span>,
      )
    case 'smallbutton':
      // 마우스를 올린 모습(옅은 바탕)으로 그려 버튼이 어디까지인지 보여 준다. 문구가 "닫기"면 X 버튼이고, 아니면 + 버튼이다.
      return frame(
        <span data-sample className="flex size-icon-button-corner items-center justify-center" style={{ ...round, background: c.hover }}>
          {all === '닫기' ? <X size={16} strokeWidth={ICON_STROKE} /> : <Plus size={16} strokeWidth={ICON_STROKE} />}
        </span>,
      )
    case 'chip':
      return frame(
        <span data-sample className={`max-w-full px-chip-x font-mono break-all ${TEXT}`} style={{ ...round, background: c.hover }}>
          {all}
        </span>,
      )
    case 'button':
      // 나란한 버튼. 마지막은 주요 버튼이고(취소, 추가처럼 끝의 것이 주된 동작이다), 그 앞의 것은 바탕 없는 버튼이다.
      // 바탕 없는 버튼은 평소에는 글자만 보이므로, 마우스를 올린 모습(옅은 바탕)으로 그려 모서리가 보이게 한다. 버튼이 하나뿐이면 테두리 버튼이다.
      return frame(
        <span className="flex flex-wrap items-center justify-center gap-actions">
          {list.map((text, i) => {
            const last = i === list.length - 1
            const look = list.length === 1 ? ring : last ? { background: c.primary, color: c.onPrimary } : { background: c.hover }
            return (
              <span key={i} data-sample className={`flex h-control items-center whitespace-nowrap ${list.length > 1 && !last ? 'px-button-ghost-x' : 'px-button-x'} ${STRONG}`} style={{ ...round, ...look }}>
                {text}
              </span>
            )
          })}
        </span>,
      )
    case 'input':
      return frame(
        <span data-sample className={`flex h-control ${SAMPLE_W} items-center px-input-x whitespace-nowrap ${TEXT}`} style={{ ...round, ...ring }}>
          {all}
        </span>,
      )
    case 'row':
      // 메뉴의 줄들. 첫 줄은 지금 열려 있는 화면이라 옅은 바탕이 깔려 있고, 그 바탕의 모서리가 이 둥글기다.
      return frame(
        <span className={`block ${SAMPLE_W}`}>
          <NavRows labels={list} colors={c} radius={value} />
        </span>,
      )
    case 'menu':
      // 떠 있는 목록(디자인 시스템을 고르는 메뉴). 둥글기는 목록 상자의 것이다(안의 줄이 아니다). 첫 줄이 지금 고른 것이라 오른쪽에 체크가 있고, "새 …"로 시작하는 줄은 만드는 줄이라 앞에 +가 있다.
      return frame(
        <span data-sample className="block w-menu max-w-full space-y-rows p-menu" style={{ ...round, ...lifted }}>
          {list.map((text, i) => (
            <span key={i} className={`flex h-row items-center gap-row-inner rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={text.startsWith('새 ') ? { color: c.soft } : undefined}>
              {text.startsWith('새 ') && <Plus size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
              <span className="min-w-0 flex-1">{text}</span>
              {i === 0 && <CheckIcon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
            </span>
          ))}
        </span>,
        true,
      )
    case 'dialog': {
      // 창을 실제 모습대로 그린다. 문구는 차례대로 제목, 입력칸의 이름표, 아래 버튼들이다("의미 색 추가, 이름, 취소, 추가"). 의미 크기 판의 창 예시와 같은 규칙이다.
      // 이름표가 없으면 내용을 막대로 대신 그린다(내용이 정해져 있지 않은 창). 버튼은 마지막이 주요 버튼이고 그 앞은 바탕 없는 버튼이다.
      const [title, label, ...actions] = list
      return frame(
        <span data-sample className="block w-dialog max-w-full p-dialog" style={{ ...round, ...lifted }}>
          <span className="mb-header block text-base leading-6 font-[650] break-words">{title}</span>
          {label ? (
            <span className="block">
              <span className={`mb-label block ${STRONG}`} style={{ color: c.faint }}>
                {label}
              </span>
              <span className="block h-control rounded-control" style={ring} />
            </span>
          ) : (
            <>
              {bar('w-3/4')}
              {bar('w-1/2', 'mt-blocks')}
            </>
          )}
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
        </span>,
        true,
      )
    }
    case 'slider':
      // 색 선택 창의 슬라이더. 높이의 절반보다 큰 둥글기면 양 끝이 반원이 된다.
      return frame(<span data-sample className={`block h-[12px] ${SAMPLE_W}`} style={{ ...round, background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />)
    case 'badge':
      return frame(
        <span className="flex flex-wrap items-center justify-center gap-actions-tight">
          {list.map((text, i) => (
            <span key={i} data-sample className={`flex h-compact items-center px-row-x font-[550] whitespace-nowrap ${SMALL}`} style={{ ...round, ...(i === 0 ? { background: c.hover } : { background: c.ink, color: c.surface }) }}>
              {text}
            </span>
          ))}
        </span>,
      )
    case 'knob':
      // 슬라이더와 색 고르는 판 위의 둥근 손잡이. 흰 테두리 안에 고른 색이 보인다.
      return frame(<span data-sample className="block size-[16px] border-[4px] border-white shadow-[0_0_0_0.5px_rgb(0_0_0/0.25),0_1px_3px_rgb(0_0_0/0.35)]" style={{ ...round, background: c.selection }} />)
    default:
      // 카드: 테두리가 있는 면. 맨 위에 그 카드의 이름이 있고, 그 아래의 내용은 자리만 알린다.
      return frame(
        <span data-sample className="block w-full max-w-[224px] p-card" style={{ ...round, ...ring }}>
          <span className={`block break-words ${STRONG}`}>{all}</span>
          {bar('w-3/4', 'mt-fields')}
        </span>,
      )
  }
}

/**
 * 판과 패널에 적는 값. 가리키는 모서리의 둥글기를 적는다(6px). 가리키는 값이 없어졌으면 그 이름 뒤에 "없어짐"을 붙인다(의미 크기와 같다).
 * 토대를 가리키지 않고 길이를 직접 적은 값(다른 도구로 만든 파일의 --radius-md: 6px)은 적힌 그대로다.
 */
function shownOf(tokens: Token[], value: string) {
  const ref = cornerRefOf(value)
  const length = resolveCorner(tokens, value)
  return { ref, length, shown: length ?? (ref ? `${lengthLabel(CORNER, ref)} · 없어짐` : value) }
}

/**
 * 의미 모서리 판의 내용. 묶음(컨트롤, 컨테이너, 표시)마다 작은 제목을 두고, 한 줄에 값 하나.
 * 왼쪽 칸(224px)에 이름, 가리키는 둥글기, 설명이 있고 오른쪽에 그 둥글기가 실제로 쓰인 모습이 있다.
 * 묶음은 파일에 처음 나오는 차례대로 놓는다. 이름과 값, 설명은 자르지 않고 줄을 바꿔 다 보여 준다.
 */
export function RadiusList({
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
  /** 가리키는 모서리의 둥글기와, 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 의미 모서리는 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
  /** 묶음 제목을 끌어 묶음의 차례를 바꾼다. */
  onMoveGroup?: (group: RadiusGroup, before: RadiusGroup | null) => void
}) {
  const rows = items.map((t) => ({ t, short: shortName(kind, t.name), ...readRadiusNote(t.note, shortName(kind, t.name)) }))
  // 묶음은 파일에 처음 나오는 차례대로 놓는다. 끌어서 바꾼 차례가 파일에 남는다.
  const groups = [...new Set(rows.map((r) => r.group))]
  const groupDrag = useReorder(groups, onMoveGroup && ((name, before) => onMoveGroup(name as RadiusGroup, before as RadiusGroup | null)), { attr: 'data-radius-group', gap: 24 })
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 판 위의 버튼으로 한다.
  if (items.length === 0) return null
  const colors = sampleColors(all)
  // 떠 있는 것(메뉴, 창)에 드리울 그림자. 이 시스템의 그림자 값이다(메뉴는 float, 창은 dialog. 없으면 드리우지 않는다).
  const shadows = { menu: all.find((t) => t.name === '--shadow-float')?.value, dialog: all.find((t) => t.name === '--shadow-dialog')?.value }
  return (
    <div className="space-y-groups">
      {groups.map((id) => {
        const g = RADIUS_GROUPS.find((x) => x.id === id)!
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
          <div key={g.id} data-radius-group={g.id} className={`relative ${groupDrag.moving(g.id) ? 'opacity-dragging' : ''}`}>
            {groupDrag.line(g.id)}
            {/* 묶음의 제목. 누르면 그 묶음의 값이 모두 선택되고, 끌면 묶음의 차례가 바뀐다(다른 의미 판의 묶음 제목과 같다). */}
            <button
              type="button"
              onClick={(e) => !groupDrag.justDragged() && onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              {...groupDrag.grab(g.id)}
              className={`mb-heading -ml-chip-x block rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus ${onMoveGroup ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {g.label}
            </button>
            <RadiusRows list={list} all={all} colors={colors} shadows={shadows} selected={selected} onSelect={onSelect} onRename={onRename} onMove={moveRow} />
          </div>
        )
      })}
    </div>
  )
}

/** 한 묶음의 줄들. 줄을 끌면 같은 묶음 안에서 차례가 바뀐다. 다른 묶음으로는 끌어 옮기지 않고 패널의 "묶음"에서 바꾼다. */
function RadiusRows({
  list,
  all,
  colors,
  shadows,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  list: { t: Token; short: string; text: string; examples: RadiusExample[] }[]
  all: Token[]
  colors: SampleColors
  shadows: { menu?: string; dialog?: string }
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
        // 예시는 둥글기를 알고(가리키는 값이 없어졌으면 그릴 수 없다) 주석에 모양이 적혀 있을 때만 그린다. 없으면 왼쪽 칸이 줄 전체를 쓴다.
        const drawn = !plain && length !== null && examples.length > 0
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
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            <span className={drawn ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
              <span data-name className="block type-label break-words">
                {short}
              </span>
              <span data-points className={`block type-code-sm break-words ${length ? 'text-ink-faint' : 'text-danger'}`}>
                {shown}
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
                  <RadiusSample key={k} shape={e.shape} value={length} colors={colors} shadow={e.shape === 'menu' ? shadows.menu : e.shape === 'dialog' ? shadows.dialog : undefined} words={e.words} />
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

/** 가리킬 수 있는 모서리들(모서리 판의 값). 고르는 칸의 줄이 된다. 이름이 곧 둥글기라서 길이만 적는다. */
const baseOptions = (tokens: Token[]) => tokens.filter((t) => CORNER.matches(t.name)).map((t) => ({ id: t.name, label: t.value, hint: '' }))

/**
 * 의미 모서리 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(가리키는 모서리), 묶음, 설명, 쓰이는 곳, 코드.
 * 의미 모서리는 모서리 판의 값을 가리키기만 한다. 길이를 여기에 직접 적지 않는다(의미 크기가 크기 판의 값만 가리키는 것과 같다).
 * 예시는 여기서 고치지 않는다. 그 둥글기가 화면 어디에 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function RadiusInspector({
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
  /** 가리키는 모서리가 있는 판(모서리 판)으로 가서 그 값을 보여 준다. */
  onOpenToken: (name: string) => void
  onRename: (next: string) => void
  /** 값(가리키는 모서리)이나 주석(묶음, 설명, 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  const { group, text, picked, words, more } = readRadiusNote(token.note, short)
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
    // 숫자로 시작하는 이름(--radius-8)은 토대의 이름과 헷갈린다. 쓰임의 이름을 짓게 한다.
    if (/^\d/.test(next)) return setNameError('숫자로 시작할 수 없어요.')
    if (next === short) return
    if (tokens.some((t) => t.name === kind.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    onRename(kind.prefix + next)
  }

  // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
  const saveNote = (patch: { group?: RadiusGroup; text?: string }) => onChange({ note: writeRadiusNote(patch.group ?? group, patch.text ?? text, picked, words, more) })

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

      <Section title="가리키는 모서리">
        {known ? (
          // 고르는 칸 옆에, 가리키는 모서리가 모서리 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다.
          <div className="flex items-center gap-actions-tight">
            <div className="min-w-0 flex-1">
              <UsePicker label="가리키는 모서리" options={options} value={ref} nameWidth="w-picker-name-wide" onChange={(next) => onChange({ value: `var(${next})` })} />
            </div>
            <button type="button" aria-label="가리키는 모서리 보러 가기" title={`모서리 판에서 ${lengthLabel(CORNER, ref)} 보기`} onClick={() => onOpenToken(ref)} className={ICON_BUTTON}>
              <ArrowUpRight size={16} strokeWidth={ICON_STROKE} />
            </button>
          </div>
        ) : (
          // 가리키던 모서리가 없어졌거나, 모서리 판의 값을 가리키지 않고 길이를 직접 적은 값이다. 모서리 판의 값 가운데서 고르게 한다.
          <div className="space-y-blocks">
            <p className="type-body text-danger">{ref ? '고른 값이 없어졌어요. 다시 골라 주세요.' : '모서리 판의 값을 가리키지 않아요. 골라 주세요.'}</p>
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
        <UsePicker label="묶음" options={RADIUS_GROUPS} value={group} nameWidth="w-picker-name-wide" onChange={(next) => saveNote({ group: next })} />
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
        <CodeRows uses={[`rounded-${short}`, `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} valueNote={ref && length ? length : undefined} />
      </FoldSection>
    </div>
  )
}

/**
 * 의미 모서리를 만드는 양식. 이름, 가리키는 모서리, 묶음, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 가리키는 모서리는 고르지 않은 채로 시작한다. 첫 값을 골라 두면 이름만 적고 만들었을 때 엉뚱한 둥글기를 가리키는 값이 생긴다.
 */
export function NewRadiusForm({ tokens, onCreate, onCancel }: { tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  const kind = KINDS.radius
  const options = baseOptions(tokens)
  const [name, setName] = useState('')
  const [ref, setRef] = useState<string | null>(null)
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [group, setGroup] = useState<RadiusGroup | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; ref?: string }>({})
  const shownGroup = group ?? guessRadiusGroup(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    if (!n) next.name = '이름을 입력해 주세요.'
    else if (!SLUG.test(n)) next.name = '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
    else if (/^\d/.test(n)) next.name = '숫자로 시작할 수 없어요.'
    else if (tokens.some((t) => t.name === kind.prefix + n)) next.name = '같은 이름이 이미 있어요.'
    if (!ref) next.ref = '모서리를 골라 주세요.'
    setError(next)
    if (Object.keys(next).length === 0 && ref) onCreate(kind.prefix + n, `var(${ref})`, writeRadiusNote(shownGroup, text))
  }

  // 가리킬 모서리가 하나도 없으면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  if (options.length === 0)
    return (
      <div>
        <p className="type-body text-ink-soft">의미 모서리는 모서리 판의 값을 가리켜요. 모서리 판에 값을 먼저 추가해 주세요.</p>
        <div className="mt-dialog-actions flex justify-end">
          <Button onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="control"
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="가리키는 모서리" plain error={error.ref}>
        <UsePicker
          label="가리키는 모서리"
          options={options}
          value={ref}
          nameWidth="w-picker-name-wide"
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={RADIUS_GROUPS} value={shownGroup} nameWidth="w-picker-name-wide" onChange={setGroup} />
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
