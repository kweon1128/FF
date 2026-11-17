// 간격 판의 내용. 값마다 어디에 쓰는지를 설명과 예시로 보여 준다.

import { useContext, type ReactNode } from 'react'
import type { Token } from './lib/api'
import { shortName, type Kind } from './lib/catalog'
import { surroundings, type Around } from './lib/roles'
import { SPACE_WORDS, isSpaceListShape, readSpaceNote, type SpaceShape } from './lib/spacing'
import { PreviewFontContext } from './ColorUses'
import { HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Phrases } from './ui'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'
// 간격이 차지하는 자리를 칠하는 색. FF가 간격을 표시할 때 쓰는 안내 색을 옅게 쓴다(사용자의 색이 아니라 FF의 표시다).
const MARK = 'color-mix(in oklab, var(--color-guide) 30%, transparent)'

/**
 * 간격이 실제로 쓰인 모습. 어떤 자리인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 간격이 차지하는 자리를 안내 색으로 칠해, 그 값이 얼마만큼인지 눈으로 보게 한다. 길이는 값 그대로다.
 * 예시는 글자만 늘어놓지 않고 실제 화면의 조각으로 그린다. 버튼은 버튼으로(나란한 버튼의 마지막은 채운 버튼), 이름표 아래에는 입력칸을, 목록은 줄로, 창에는 아래 버튼까지.
 * 무엇과 무엇 사이인지가 그림에서 바로 읽혀야 그 간격을 어디에 쓰는지 알 수 있다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function SpaceSample({ shape, value, around, words: written = '' }: { shape: SpaceShape; value: string; around: Around; words?: string }) {
  const font = useContext(PreviewFontContext)
  const all = written || SPACE_WORDS[shape]
  const list = isSpaceListShape(shape)
    ? all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
    : [all]
  const faint = `color-mix(in oklab, ${around.ink} 16%, ${around.surface})`
  const TEXT = 'text-sm leading-5'
  // 버튼, 입력칸, 면의 테두리. 칠한 자리 위에서도 보이게 예시의 다른 옅은 선보다 진하게 긋는다.
  const line = `color-mix(in oklab, ${around.ink} 32%, ${around.surface})`
  // 칠하는 자리는 어느 모양에서나 같은 규칙이다: 간격의 방향으로는 값만큼, 그 가로지르는 방향으로는 예시 상자의 끝에서 끝까지 길게 긋는다.
  // 가로 간격(사이, 좌우 여백)은 위에서 아래까지 세로 띠, 세로 간격(쌓임, 위아래 여백)은 왼쪽에서 오른쪽까지 가로 띠다.
  // 어떤 것은 길게 어떤 것은 딱 맞게 그으면 같은 판 안에서 표시가 두 가지 말이 되어 어색하다. (띠는 내용이 가운데에 놓여도 상자의 끝에 닿게 아주 길게 긋고, 넘치는 것은 상자가 자른다.)
  const tall = (
    <span data-sample className="relative block shrink-0 self-stretch" style={{ width: value }}>
      <span className="pointer-events-none absolute inset-x-0 -inset-y-[2000px]" style={{ background: MARK }} />
    </span>
  )
  const wide = (
    <span data-sample className="relative block" style={{ height: value }}>
      <span className="pointer-events-none absolute inset-y-0 -inset-x-[2000px]" style={{ background: MARK }} />
    </span>
  )
  const outline = (round: string) => <span className={`pointer-events-none absolute inset-0 border ${round}`} style={{ borderColor: line }} />
  const bar = (width: string) => <span className={`mt-2 block h-2 rounded-sm ${width}`} style={{ background: faint }} />
  // 내용은 상자의 가운데에 놓는다(효과 판의 예시와 같다).
  const frame = (body: ReactNode) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-md px-3 py-3 ${EDGE}`} style={{ background: around.surface, color: around.ink, fontFamily: font }}>
      {body}
    </span>
  )
  // 버튼 하나. 나란히 놓인 버튼의 마지막은 채운 버튼이다(취소, 추가처럼 끝의 것이 주된 동작이다).
  const chip = (text: string, filled = false) => (
    <span
      className={`flex h-7 items-center rounded-md px-2 font-[550] whitespace-nowrap ${TEXT}`}
      style={filled ? { background: around.ink, color: around.surface } : { boxShadow: `inset 0 0 0 1px ${line}` }}
    >
      {text}
    </span>
  )
  const soft = `color-mix(in oklab, ${around.ink} 56%, ${around.surface})`
  // 이름표(입력칸 위의 작은 글자)와 입력칸. 입력칸의 값이 없으면 빈 칸이다.
  const tag = (text: string) => <span className={`block font-[550] ${TEXT}`} style={{ color: soft }}>{text}</span>
  const box = (text = '') => (
    <span className={`flex h-7 w-40 max-w-full items-center rounded-md px-2 whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 0 0 1px ${line}` }}>
      {text}
    </span>
  )
  switch (shape) {
    case 'gap':
      return frame(
        <span className="flex items-stretch">
          {list.map((text, i) => (
            <span key={i} className="flex items-stretch">
              {i > 0 && tall}
              {chip(text, list.length > 1 && i === list.length - 1)}
            </span>
          ))}
        </span>,
      )
    case 'label':
      // 이름표와 그 아래 입력칸. 첫 문구가 이름표, 나머지가 입력칸에 적힌 값이다.
      return frame(
        <span className="block">
          {tag(list[0] ?? '')}
          {wide}
          {box(list.slice(1).join(', '))}
        </span>,
      )
    case 'rows':
      // 목록의 줄들. 첫 줄은 마우스를 올린 줄처럼 바탕을 옅게 깐다.
      return frame(
        <span className="block">
          {list.map((text, i) => (
            <span key={i} className="block">
              {i > 0 && wide}
              <span className={`flex h-7 items-center rounded-md px-2 whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: `color-mix(in oklab, ${around.ink} 6%, ${around.surface})` } : undefined}>
                {text}
              </span>
            </span>
          ))}
        </span>,
      )
    case 'fields':
      // 이름표가 붙은 입력칸들. 칸과 칸 사이가 간격이다(이름표와 입력칸 사이는 4px로 고정해 그린다).
      return frame(
        <span className="block">
          {list.map((text, i) => (
            <span key={i} className="block">
              {i > 0 && wide}
              {tag(text)}
              <span className="mt-1 block">{box()}</span>
            </span>
          ))}
        </span>,
      )
    case 'groups':
      // 제목이 붙은 묶음들. 묶음과 묶음 사이가 간격이다.
      return frame(
        <span className="block">
          {list.map((text, i) => (
            <span key={i} className="block">
              {i > 0 && wide}
              <span className={`block font-[550] ${TEXT}`}>{text}</span>
              <span className="mt-2 block rounded-md px-2 py-2" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
                <span className="block h-2 w-24 rounded-sm" style={{ background: faint }} />
              </span>
            </span>
          ))}
        </span>,
      )
    case 'stack':
      return frame(
        <span className="block">
          {list.map((text, i) => (
            <span key={i} className="block">
              {i > 0 && wide}
              <span className={`block break-words ${TEXT}`}>{text}</span>
            </span>
          ))}
        </span>,
      )
    case 'button':
      // 테두리 버튼. 글자의 왼쪽과 오른쪽이 여백이다.
      return frame(
        <span className={`relative inline-flex h-7 items-stretch font-[550] whitespace-nowrap ${TEXT}`}>
          {tall}
          <span className="flex items-center">{all}</span>
          {tall}
          {outline('rounded-md')}
        </span>,
      )
    case 'input':
      // 입력칸. 적은 값의 왼쪽과, 칸의 오른쪽 끝이 여백이다.
      return frame(
        <span className={`relative flex h-7 w-40 max-w-full items-stretch whitespace-nowrap ${TEXT}`}>
          {tall}
          <span className="flex min-w-0 flex-1 items-center overflow-hidden">{all}</span>
          {tall}
          {outline('rounded-md')}
        </span>,
      )
    default: {
      // 면: 제목과 내용이 있는 패널, 창, 카드. 네 가장자리(면 좌우는 왼쪽과 오른쪽만)가 여백이다.
      const content = (
        <span className="block">
          <span className={`block break-words font-[550] ${TEXT}`}>{all}</span>
          {bar('w-28')}
          {bar('w-20')}
        </span>
      )
      if (shape === 'surfacex')
        return frame(
          <span className="relative inline-flex max-w-full items-stretch">
            {tall}
            <span className="block py-3">
              <span className={`block font-[550] ${TEXT}`}>{all}</span>
              <span className="mt-2 block">{box()}</span>
            </span>
            {tall}
            {outline('rounded-lg')}
          </span>,
        )
      // 네 가장자리: 왼쪽·오른쪽의 세로 띠와 위·아래의 가로 띠가 예시 상자의 끝까지 뻗어 모서리에서 겹친다.
      const strip = 'pointer-events-none absolute'
      return frame(
        <span className="relative inline-block max-w-full" style={{ padding: value }}>
          <span data-sample className={`${strip} -inset-y-[2000px] left-0`} style={{ width: value, background: MARK }} />
          <span className={`${strip} -inset-y-[2000px] right-0`} style={{ width: value, background: MARK }} />
          <span className={`${strip} -inset-x-[2000px] top-0`} style={{ height: value, background: MARK }} />
          <span className={`${strip} -inset-x-[2000px] bottom-0`} style={{ height: value, background: MARK }} />
          <span className="relative block">
            {content}
            <span className="mt-4 flex justify-end gap-2">
              <span className="block h-6 w-12 rounded-md" style={{ boxShadow: `inset 0 0 0 1px ${line}` }} />
              <span className="block h-6 w-12 rounded-md" style={{ background: around.ink }} />
            </span>
          </span>
          {outline('rounded-lg')}
        </span>,
      )
    }
  }
}

/**
 * 간격 판의 내용. 한 줄에 값 하나. 왼쪽 칸(224px)에 이름, 값, 설명이 있고 오른쪽에 그 값이 쓰인 모습이 있다.
 * 간격은 값의 크기로 차례가 정해지므로 끌어 옮길 수 없다.
 */
export function SpaceList({
  kind,
  items,
  all,
  selected,
  onSelect,
  onRename,
}: {
  kind: Kind
  items: Token[]
  /** 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
}) {
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const around = surroundings(all)
  return (
    <div className="space-y-1 rounded-lg border border-hairline bg-canvas p-1">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const { text, shape, words, more } = readSpaceNote(t.note)
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
            className={`group relative flex w-full items-center gap-4 rounded-md px-3 py-2 text-left select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <span className="w-56 shrink-0">
              <span data-name className="block type-label break-words">
                {short}
              </span>
              <span className="block type-code-sm break-words text-ink-faint">{t.value}</span>
              {text && (
                <span className="mt-1 block type-caption break-words text-ink-faint">
                  <Phrases text={text} />
                </span>
              )}
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            <span className="block min-w-0 flex-1 space-y-2">
              {[{ shape, words }, ...more].map((e, k) => (
                <SpaceSample key={k} shape={e.shape} value={t.value} around={around} words={e.words} />
              ))}
            </span>
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={t.value} />}
          </button>
        )
      })}
    </div>
  )
}
