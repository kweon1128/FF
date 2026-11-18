// 의미 간격 판의 내용. 쓰임마다 이름과 가리키는 간격, 설명, 예시를 보여 준다.

import { useContext, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import type { Token } from './lib/api'
import { KINDS, SLUG, SPACE_REF, shortName, type Kind } from './lib/catalog'
import { surroundings, type Around } from './lib/roles'
import { SPACE_USES, SPACE_WORDS, guessSpaceUse, isSpaceListShape, readSpaceNote, writeSpaceNote, type SpaceExample, type SpaceShape, type SpaceUse } from './lib/spacing'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass } from './ui'
import { useReorder } from './useReorder'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'
// 간격이 차지하는 자리를 칠하는 색. FF가 간격을 표시할 때 쓰는 안내 색을 옅게 쓴다(사용자의 색이 아니라 FF의 표시다).
const MARK = 'color-mix(in oklab, var(--color-guide) 30%, transparent)'
// 짙은 바탕(채운 버튼) 위에서는 같은 농도로 칠하면 묻혀서, 그 안쪽에만 덧칠한다.
const MARK_ON_DARK = 'color-mix(in oklab, var(--color-guide) 55%, transparent)'

/**
 * 간격이 실제로 쓰인 모습. 어떤 자리인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 간격이 차지하는 자리를 안내 색으로 칠해, 그 값이 얼마만큼인지 눈으로 보게 한다. 길이는 값 그대로다.
 * 예시는 글자만 늘어놓지 않고 실제 화면의 조각으로 그린다. 버튼은 버튼으로(나란한 버튼의 마지막은 채운 버튼), 이름표 아래에는 입력칸을, 목록은 줄로, 창에는 아래 버튼까지.
 * 무엇과 무엇 사이인지가 그림에서 바로 읽혀야 그 간격을 어디에 쓰는지 알 수 있다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function SpaceSample({ shape, value, around, words: written = '' }: { shape: SpaceShape; value: string; around: Around; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
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
  // inner는 띠가 지나는 물건 안쪽에만 덧칠하는 색이다. 짙은 바탕 위에서도 여백 자리가 보이게 한다(물건 밖의 띠는 다른 예시와 같은 농도로 둔다).
  const tallOn = (inner?: string) => (
    <span data-sample className="relative block shrink-0 self-stretch" style={{ width: value }}>
      <span className="pointer-events-none absolute inset-x-0 -inset-y-[2000px]" style={{ background: MARK }} />
      {inner && <span className="pointer-events-none absolute inset-0" style={{ background: inner }} />}
    </span>
  )
  const tall = tallOn()
  // 마우스를 올린 바탕. 바탕 없는 버튼과 메뉴 줄은 이 바탕이 있어야 상자가 보인다.
  const hover = `color-mix(in oklab, ${around.ink} 8%, ${around.surface})`
  const wide = (
    <span data-sample className="relative block" style={{ height: value }}>
      <span className="pointer-events-none absolute inset-y-0 -inset-x-[2000px]" style={{ background: MARK }} />
    </span>
  )
  const outline = (round: string) => <span className={`pointer-events-none absolute inset-0 border ${round}`} style={{ borderColor: line }} />
  const bar = (width: string) => <span className={`mt-blocks block h-2 rounded-sm ${width}`} style={{ background: faint }} />
  // 내용은 상자의 가운데에 놓는다(효과 판의 예시와 같다).
  const frame = (body: ReactNode) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-md p-sample ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink, fontFamily: font }}>
      {body}
    </span>
  )
  // 버튼 하나. 나란히 놓인 버튼의 마지막은 채운 버튼이다(취소, 추가처럼 끝의 것이 주된 동작이다).
  const chip = (text: string, filled = false) => (
    <span
      className={`flex h-7 items-center rounded-md px-button-x font-[550] whitespace-nowrap ${TEXT}`}
      style={filled ? { background: around.ink, color: around.surface } : { boxShadow: `inset 0 0 0 1px ${line}` }}
    >
      {text}
    </span>
  )
  const soft = `color-mix(in oklab, ${around.ink} 56%, ${around.surface})`
  // 이름표(입력칸 위의 작은 글자)와 입력칸. 입력칸의 값이 없으면 빈 칸이다.
  const tag = (text: string) => <span className={`block font-[550] ${TEXT}`} style={{ color: soft }}>{text}</span>
  const box = (text = '') => (
    <span className={`flex h-7 w-40 max-w-full items-center rounded-md px-input-x whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 0 0 1px ${line}` }}>
      {text}
    </span>
  )
  // 네 가장자리가 여백인 상자. 왼쪽·오른쪽의 세로 띠와 위·아래의 가로 띠가 예시 상자의 끝까지 뻗어 모서리에서 겹친다.
  const ring = (content: ReactNode) => (
    <span className="relative inline-block max-w-full" style={{ padding: value }}>
      <span data-sample className="pointer-events-none absolute -inset-y-[2000px] left-0" style={{ width: value, background: MARK }} />
      <span className="pointer-events-none absolute -inset-y-[2000px] right-0" style={{ width: value, background: MARK }} />
      <span className="pointer-events-none absolute -inset-x-[2000px] top-0" style={{ height: value, background: MARK }} />
      <span className="pointer-events-none absolute -inset-x-[2000px] bottom-0" style={{ height: value, background: MARK }} />
      <span className="relative block">{content}</span>
      {outline('rounded-lg')}
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
              <span className={`flex h-7 items-center rounded-md px-row-x whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: `color-mix(in oklab, ${around.ink} 6%, ${around.surface})` } : undefined}>
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
              <span className="mt-label block">{box()}</span>
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
              <span className="mt-heading block rounded-md px-box py-box" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
                <span className="block h-2 w-24 rounded-sm" style={{ background: faint }} />
              </span>
            </span>
          ))}
        </span>,
      )
    case 'icon':
      // 바탕 없는 버튼 안의 아이콘(네모로 자리만 그린다)과 글자 사이. 아이콘이 붙는 버튼은 대부분 바탕 없는 버튼이라 그 모습(마우스를 올린 바탕)으로 그린다.
      return frame(
        <span className={`relative inline-flex h-7 items-stretch px-button-ghost-x font-[550] whitespace-nowrap ${TEXT}`} style={{ color: soft }}>
          <span className="absolute inset-0 rounded-md" style={{ background: hover }} />
          <span className="relative flex items-center">
            <span className="block size-4 rounded-sm" style={{ background: soft }} />
          </span>
          {tall}
          <span className="relative flex items-center">{all}</span>
        </span>,
      )
    case 'ghosts':
      // 나란한 바탕 없는 버튼들. 둘 다 마우스를 올린 바탕으로 그려, 바탕끼리 닿지 않는 것을 보여 준다.
      return frame(
        <span className="flex items-stretch">
          {list.map((text, i) => (
            <span key={i} className="flex items-stretch">
              {i > 0 && tall}
              <span className={`flex h-7 items-center rounded-md px-button-ghost-x font-[550] whitespace-nowrap ${TEXT}`} style={{ background: hover, color: soft }}>
                {text}
              </span>
            </span>
          ))}
        </span>,
      )
    case 'unit':
      // 입력칸 안의 값과 그 뒤의 단위 사이. 첫 문구가 값, 나머지가 단위다.
      return frame(
        <span className={`relative flex h-7 w-24 items-stretch px-input-x whitespace-nowrap ${TEXT}`}>
          <span className="flex items-center">{list[0]}</span>
          {tall}
          <span className="flex items-center" style={{ color: soft }}>
            {list.slice(1).join(', ')}
          </span>
          {outline('rounded-md')}
        </span>,
      )
    case 'chip':
      // 칩(옅은 바탕 위의 짧은 글자)의 왼쪽과 오른쪽.
      return frame(
        <span className={`relative inline-flex h-5 items-stretch whitespace-nowrap ${TEXT}`}>
          <span className="absolute inset-0 rounded-sm" style={{ background: hover }} />
          {tall}
          <span className="relative flex items-center">{all}</span>
          {tall}
        </span>,
      )
    case 'inputs':
      // 가로로 나란한 입력칸들 사이.
      return frame(
        <span className="flex items-stretch">
          {list.map((text, i) => (
            <span key={i} className="flex items-stretch">
              {i > 0 && tall}
              <span className={`flex h-7 w-20 items-center rounded-md px-input-x whitespace-nowrap ${TEXT}`} style={{ boxShadow: `inset 0 0 0 1px ${line}` }}>
                {text}
              </span>
            </span>
          ))}
        </span>,
      )
    case 'row':
      // 메뉴 줄의 왼쪽과 오른쪽. 줄은 마우스를 올린 모습으로 그린다.
      return frame(
        <span className={`relative flex h-7 w-40 max-w-full items-stretch whitespace-nowrap ${TEXT}`}>
          <span className="absolute inset-0 rounded-md" style={{ background: hover }} />
          {tall}
          <span className="relative flex min-w-0 flex-1 items-center">{all}</span>
          {tall}
        </span>,
      )
    case 'rowy':
      // 줄의 위와 아래.
      return frame(
        <span className={`relative flex w-40 max-w-full flex-col ${TEXT}`}>
          <span className="absolute inset-0 rounded-md" style={{ background: hover }} />
          {wide}
          <span className="relative block px-row-x">{all}</span>
          {wide}
        </span>,
      )
    case 'menu':
      // 목록 상자의 네 가장자리. 안에는 줄들이 있고 첫 줄은 마우스를 올린 모습이다.
      return frame(
        ring(
          <span className="block w-32 space-y-rows">
            {list.map((text, i) => (
              <span key={i} className={`flex h-7 items-center rounded-md px-row-x whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: hover } : undefined}>
                {text}
              </span>
            ))}
          </span>,
        ),
      )
    case 'box':
      // 내용이 든 상자(판, 카드, 작은 창)의 네 가장자리. 문구를 적으면 제목으로 놓고, 없으면 내용 막대만 그린다.
      return frame(
        ring(
          <span className="block w-28">
            {written && <span className={`block break-words font-[550] ${TEXT}`}>{written}</span>}
            <span className={`block h-2 w-28 rounded-sm ${written ? 'mt-blocks' : ''}`} style={{ background: faint }} />
            {bar('w-20')}
          </span>,
        ),
      )
    case 'heading':
      // 제목과 그 아래 내용 사이.
      return frame(
        <span className="block w-40 max-w-full">
          <span className={`block font-[550] ${TEXT}`}>{all}</span>
          {wide}
          <span className="block rounded-md px-box py-box" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
            <span className="block h-2 w-24 rounded-sm" style={{ background: faint }} />
          </span>
        </span>,
      )
    case 'cols':
      // 한 줄 안의 이름 칸과 그 옆 칸 사이.
      return frame(
        <span className="flex items-stretch">
          <span className={`flex items-center font-[550] ${TEXT}`}>{all}</span>
          {tall}
          <span className="flex h-10 w-24 items-center rounded-md px-box" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
            <span className="block h-2 w-16 rounded-sm" style={{ background: faint }} />
          </span>
        </span>,
      )
    case 'grid':
      // 격자의 칸과 칸 사이.
      return frame(
        <span className="flex items-stretch">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex items-stretch">
              {i > 0 && tall}
              <span className="block size-8 rounded-md" style={{ background: faint }} />
            </span>
          ))}
        </span>,
      )
    case 'gridy':
      // 격자의 줄과 줄 사이.
      return frame(
        <span className="block">
          {[0, 1].map((r) => (
            <span key={r} className="block">
              {r > 0 && wide}
              <span className="flex gap-cells">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block size-8 rounded-md" style={{ background: faint }} />
                ))}
              </span>
            </span>
          ))}
        </span>,
      )
    case 'surfacey':
      // 패널 구역의 위와 아래.
      return frame(
        <span className="relative inline-flex max-w-full flex-col px-section-x">
          {wide}
          <span className="block">
            <span className={`block font-[550] ${TEXT}`}>{all}</span>
            <span className="mt-heading block">{box()}</span>
          </span>
          {wide}
          {outline('rounded-lg')}
        </span>,
      )
    case 'footer':
      // 창의 내용(입력칸)과 그 아래 버튼 줄 사이.
      return frame(
        <span className="block w-40 max-w-full">
          {box()}
          {wide}
          <span className="flex justify-end gap-actions">
            {list.map((text, i) => (
              <span key={i}>{chip(text, list.length > 1 && i === list.length - 1)}</span>
            ))}
          </span>
        </span>,
      )
    case 'bar':
      // 화면 위의 막대나 알림의 왼쪽과 오른쪽.
      return frame(
        <span className={`relative flex h-8 w-full items-stretch font-[550] whitespace-nowrap ${TEXT}`}>
          {tall}
          <span className="flex min-w-0 flex-1 items-center">{all}</span>
          {tall}
          {outline('rounded-md')}
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
    case 'filled':
      // 채운 버튼. 바탕이 글자 색이라 그 위의 띠는 더 진하게 칠해야 보인다.
      return frame(
        <span className={`relative inline-flex h-7 items-stretch font-[550] whitespace-nowrap ${TEXT}`} style={{ color: around.surface }}>
          <span className="absolute inset-0 rounded-md" style={{ background: around.ink }} />
          {tallOn(MARK_ON_DARK)}
          <span className="relative flex items-center">{all}</span>
          {tallOn(MARK_ON_DARK)}
        </span>,
      )
    case 'ghost':
      // 바탕 없는 버튼. 평소에는 글자만 보이므로, 마우스를 올린 모습(옅은 바탕)으로 그려 상자가 어디까지인지 보여 준다.
      return frame(
        <span className={`relative inline-flex h-7 items-stretch font-[550] whitespace-nowrap ${TEXT}`} style={{ color: soft }}>
          <span className="absolute inset-0 rounded-md" style={{ background: hover }} />
          {tall}
          <span className="relative flex items-center">{all}</span>
          {tall}
        </span>,
      )
    case 'rowicon':
      // 메뉴 줄 안의 아이콘(네모로 자리만 그린다)과 글자 사이. 줄은 마우스를 올린 모습으로 그린다.
      return frame(
        <span className={`relative flex h-7 w-40 max-w-full items-stretch px-row-x whitespace-nowrap ${TEXT}`}>
          <span className="absolute inset-0 rounded-md" style={{ background: hover }} />
          <span className="relative flex items-center">
            <span className="block size-4 rounded-sm" style={{ background: soft }} />
          </span>
          {tall}
          <span className="relative flex items-center">{all}</span>
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
            <span className="block py-section-y">
              <span className={`block font-[550] ${TEXT}`}>{all}</span>
              <span className="mt-heading block">{box()}</span>
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
            <span className="mt-dialog-actions flex justify-end gap-actions">
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

const SPACE = KINDS.space

/** 의미 간격이 가리키는 토대 간격의 변수 이름. 가리키지 않으면 null. */
export const spaceRefOf = (value: string) => SPACE_REF.exec(value.trim())?.[1] ?? null

/** 그림에 깔아 줄 간격 변수들. 토대는 적힌 길이 그대로, 의미 간격은 가리키는 토대의 길이로 풀어서 넣는다(가리키는 값이 없어진 것은 뺀다). */
export function spaceVars(tokens: Token[]): CSSProperties {
  const vars: Record<string, string> = {}
  for (const t of tokens) {
    if (!t.name.startsWith(SPACE.prefix)) continue
    const length = spaceRefOf(t.value) ? resolveSpace(tokens, t.value) : t.value
    if (length) vars[t.name] = length
  }
  return vars as CSSProperties
}

/** 의미 간격의 실제 길이(가리키는 토대 간격의 값). 가리키는 값이 없어졌으면 null. */
export function resolveSpace(tokens: Token[], value: string): string | null {
  const ref = spaceRefOf(value)
  return ref ? (tokens.find((t) => t.name === ref && SPACE.matches(t.name))?.value ?? null) : null
}

/**
 * 의미 간격 판의 내용. 묶음(버튼, 입력칸, 목록, 판, 패널, 창)마다 제목을 두고, 한 줄에 쓰임 하나.
 * 왼쪽 칸(224px)에 이름, 가리키는 간격과 그 길이, 설명이 있고 오른쪽에 그 간격이 쓰인 모습이 있다.
 * 예시는 주석에 모양을 적어 둔 값에만 있다.
 */
export function SpaceList({
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
  /** 끌어서 차례를 바꾼다. 의미 간격은 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
  kind: Kind
  items: Token[]
  /** 가리키는 간격의 길이와, 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onSelectGroup: (names: string[], additive: boolean, focusGroup: boolean) => void
  onRename: (name: string) => void
  /** 묶음 제목을 끌어 묶음의 차례를 바꾼다. */
  onMoveGroup?: (use: SpaceUse, before: SpaceUse | null) => void
}) {
  const rows = items.map((t) => ({ t, short: shortName(kind, t.name), ...readSpaceNote(t.note, shortName(kind, t.name)) }))
  // 묶음은 파일에 처음 나오는 차례대로 놓는다. 끌어서 바꾼 차례가 파일에 남는다.
  const uses = [...new Set(rows.map((r) => r.use))]
  const groupDrag = useReorder(uses, onMoveGroup && ((use, before) => onMoveGroup(use as SpaceUse, before as SpaceUse | null)), false, 'data-space-group')
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const around = surroundings(all)
  return (
    <div className="space-y-groups">
      {uses.map((use, at) => {
        const u = SPACE_USES.find((x) => x.id === use)!
        const list = rows.filter((r) => r.use === u.id)
        // 줄을 묶음의 맨 끝에 놓으면, 파일에서도 이 묶음의 마지막 줄 바로 뒤에 놓는다. 파일의 맨 끝으로 보내면 묶음의 차례가 흐트러진다.
        const moveRow =
          onMove &&
          ((name: string, before: string | null) => {
            if (before !== null) return onMove(name, before)
            const last = list.filter((r) => r.t.name !== name).at(-1)
            const after = last ? items.slice(items.indexOf(last.t) + 1).find((t) => t.name !== name) : undefined
            onMove(name, after?.name ?? null)
          })
        return (
          <div key={u.id} data-space-group={u.id} className={`relative ${groupDrag.moving(u.id) ? 'opacity-40' : ''}`}>
            {groupDrag.line(u.id, at)}
            <button
              type="button"
              onClick={(e) => !groupDrag.justDragged() && onSelectGroup(list.map((r) => r.t.name), isAdditive(e), false)}
              {...groupDrag.grab(u.id)}
              className="mb-heading -ml-chip-x cursor-grab active:cursor-grabbing rounded-sm px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-2"
            >
              {u.label}
            </button>
            <SpaceRows list={list} all={all} around={around} selected={selected} onSelect={onSelect} onRename={onRename} onMove={moveRow} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * 한 묶음의 줄들. 줄을 끌면 같은 묶음 안에서 차례가 바뀐다.
 * 다른 묶음으로는 끌어 옮기지 않는다. 묶음은 그 간격이 무엇에 딸렸는지라서 패널의 "묶음"에서 바꾼다.
 */
function SpaceRows({
  list,
  all,
  around,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  list: { t: Token; short: string; text: string; examples: SpaceExample[] }[]
  all: Token[]
  around: Around
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(list.map((r) => r.t.name), onMove)
  return (
            <div className="space-y-rows rounded-lg border border-hairline bg-canvas p-menu">
              {list.map(({ t, short, text, examples }, i) => {
                const isSelected = selected.includes(t.name)
                const ref = spaceRefOf(t.value)
                const length = resolveSpace(all, t.value)
                // 가리키는 간격과 그 길이를 함께 적는다(3 · 12px). 가리키는 값이 없어졌으면 그 이름 뒤에 "없어짐"을 붙여 빨갛게 적는다(의미 색, 의미 글꼴과 같다).
                const shown = ref && length ? `${shortName(SPACE, ref)} · ${length}` : ref ? `${shortName(SPACE, ref)} · 없어짐` : t.value
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
                    className={`group relative flex w-full items-center gap-columns rounded-md px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
                  >
                    {reorder.line(t.name, i)}
                    <span className={examples.length ? 'w-56 shrink-0' : 'min-w-0 flex-1'}>
                      <span data-name className="block type-label break-words">
                        {short}
                      </span>
                      <span className={`block type-code-sm break-words ${length ? 'text-ink-faint' : 'text-danger'}`}>{shown}</span>
                      {!plain && text && (
                        <span className="mt-label block type-caption break-words text-ink-faint">
                          <Phrases text={text} />
                        </span>
                      )}
                    </span>
                    {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
                    {!plain && examples.length > 0 && (
                      <span className="block min-w-0 flex-1 space-y-blocks">
                        {examples.map((e, k) => (
                          <SpaceSample key={k} shape={e.shape} value={length ?? '0px'} around={around} words={e.words} />
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

/** 가리킬 수 있는 토대 간격들. 고르는 칸의 줄이 된다(이름은 진하게, 길이는 옅게). */
const baseOptions = (tokens: Token[]) => tokens.filter((t) => SPACE.matches(t.name)).map((t) => ({ id: t.name, label: shortName(SPACE, t.name), hint: t.value }))

/**
 * 의미 간격 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(가리키는 간격), 묶음, 설명, 쓰이는 곳, 코드.
 * 예시는 여기서 고치지 않는다. 그 간격이 화면 어디에 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function SpaceUseInspector({
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
  /** 값(가리키는 간격)이나 주석(묶음, 설명, 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  const { use, text, picked, words, more } = readSpaceNote(token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  const options = baseOptions(tokens)
  const ref = spaceRefOf(token.value)
  const length = resolveSpace(tokens, token.value)

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    // 만들 때와 같은 규칙. 숫자로 시작하는 이름은 토대 간격(--spacing-2)의 이름이라 의미 간격에 쓸 수 없다.
    if (/^\d/.test(next)) return setNameError('숫자로 시작하는 이름은 토대 간격의 이름이에요.')
    if (tokens.some((t) => t.name === kind.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    onRename(kind.prefix + next)
  }

  // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
  const saveNote = (patch: { use?: SpaceUse; text?: string }) => onChange({ note: writeSpaceNote(patch.use ?? use, patch.text ?? text, picked, words, more) })

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

      <Section title="가리키는 간격">
        {ref && options.some((o) => o.id === ref) ? (
          <UsePicker label="가리키는 간격" options={options} value={ref} nameWidth="w-8" onChange={(next) => onChange({ value: `var(${next})` })} />
        ) : (
          // 가리키던 간격이 없어졌다. 다시 고르게 한다.
          <div className="space-y-blocks">
            <p className="type-body text-danger">고른 값이 없어졌어요. 다시 골라 주세요.</p>
            <div className="flex flex-wrap gap-actions-tight">
              {options.map((o) => (
                <Button key={o.id} variant="ghost" onClick={() => onChange({ value: `var(${o.id})` })}>
                  {o.label} · {o.hint}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="묶음">
        <UsePicker label="묶음" options={SPACE_USES} value={use} nameWidth="w-12" onChange={(next) => saveNote({ use: next })} />
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
                className="-ml-button-ghost-x flex h-8 max-w-full items-center rounded-md px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-2"
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
        {/* 간격 클래스는 무엇의 간격인지(p, px, gap, mt…) 뒤에 이름을 붙여 쓴다. */}
        <CodeRows uses={[`gap-${short}`, `px-${short}`, `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} valueNote={length ?? undefined} />
      </FoldSection>
    </div>
  )
}

/** 의미 간격을 만드는 양식. 이름, 가리키는 간격, 묶음을 정한다. 설명은 만든 뒤에 패널에서 적는다. */
export function NewSpaceUseForm({ tokens, onCreate, onCancel }: { tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  const options = baseOptions(tokens)
  const [name, setName] = useState('')
  const [ref, setRef] = useState(options[0]?.id ?? '')
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [use, setUse] = useState<SpaceUse | null>(null)
  const [error, setError] = useState<string>()
  const shownUse = use ?? guessSpaceUse(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const problem = !n
      ? '이름을 입력해 주세요.'
      : !SLUG.test(n)
        ? '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
        : /^\d/.test(n)
          ? '숫자로 시작하는 이름은 토대 간격의 이름이에요.'
          : tokens.some((t) => t.name === KINDS.spaceUse.prefix + n)
            ? '같은 이름이 이미 있어요.'
            : undefined
    setError(problem)
    if (problem) return
    onCreate(KINDS.spaceUse.prefix + n, `var(${ref})`, writeSpaceNote(shownUse, ''))
  }

  // 가리킬 토대 간격이 하나도 없으면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  if (options.length === 0)
    return (
      <div>
        <p className="type-body text-ink-soft">의미 간격은 간격 판의 값을 가리켜요. 간격 판에 값을 먼저 추가해 주세요.</p>
        <div className="mt-dialog-actions flex justify-end">
          <Button onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="actions"
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
        />
      </Field>
      <Field label="가리키는 간격" plain>
        <UsePicker label="가리키는 간격" options={options} value={ref} nameWidth="w-8" onChange={setRef} />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={SPACE_USES} value={shownUse} nameWidth="w-12" onChange={setUse} />
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
