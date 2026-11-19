// 움직임 판(시간, 이징)의 예시와, 두 종류가 줄 목록·패널·추가 창에 넘기는 것.

import { useContext, type CSSProperties, type ReactNode } from 'react'
import { CURVE_PRESETS, MOTION_SHAPES, MOTION_TITLES, MOTION_WORDS, msOf, parseCurve, writeCurve, type MotionKind, type MotionShape } from './lib/motion'
import type { KindExample } from './lib/kindnote'
import { SAMPLE_BAR, SAMPLE_W } from './lib/sample'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { NavRows } from './SampleParts'
import type { SampleContext, ValueSpec } from './ValueBoard'
import { UsePicker } from './ui'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/**
 * 그 시간과 곡선으로 실제로 움직이는 모습. 줄에 마우스를 올리면 움직이고, 떼면 같은 움직임으로 돌아간다.
 * 움직이는 것은 화면에서 실제로 움직이는 요소다. 캔버스에서 미끄러져 오는 판, 마우스를 올린 줄의 바탕, 나타나는 창, 올라오는 알림.
 * 시간의 예시는 그 시간으로(곡선은 브라우저의 기본), 이징의 예시는 그 곡선으로 움직인다. 곡선은 짧은 시간에는 눈에 보이지 않아서 0.8초로 늘려 보여 준다.
 * 색은 이 디자인 시스템의 것이다. 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다.
 */
export function MotionSample({ kind, shape, value, context, words: written = '' }: { kind: MotionKind; shape: MotionShape; value: string; context: SampleContext; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const { colors: c, shadows } = context
  const list = (written || MOTION_WORDS[shape]).split(', ').map((w) => w.trim())
  const TEXT = 'text-sm leading-5'
  const STRONG = 'text-sm leading-5 font-[550]'
  const ring = { boxShadow: `inset 0 0 0 1px ${c.line}` }
  // 움직임에 넣는 값. 줄(group)에 마우스를 올리면 클래스가 끝 모습으로 바뀌고, 그 사이를 이 값으로 움직인다.
  const moving: CSSProperties = kind === 'duration' ? { transitionDuration: value } : { transitionDuration: '800ms', transitionTimingFunction: value }
  const bar = (width: string) => <span className={`block ${SAMPLE_BAR} rounded-small ${width}`} style={{ background: c.filler }} />
  /** 아래에 깔리는 화면. 무엇이 적혀 있는지는 중요하지 않아서 막대로 자리만 알린다. */
  const page = (
    <span className="absolute inset-0 block space-y-blocks p-sample">
      {bar('w-1/3')}
      {bar('w-2/3')}
      {bar('w-1/2')}
      {bar('w-3/5')}
    </span>
  )
  const frame = (height: string, body: ReactNode, background = c.surface) => (
    <span className={`relative isolate block w-full overflow-hidden rounded-card ${height} ${EDGE}`} style={{ ...space, background, color: c.ink, fontFamily: font }}>
      {body}
    </span>
  )
  switch (shape) {
    case 'fade':
      // 메뉴의 줄들. 줄에 마우스를 올리면 둘째 줄의 바탕이 이 움직임으로 나타난다(첫 줄은 지금 열려 있는 화면이라 바탕이 늘 있다).
      return frame(
        'h-[136px]',
        <span className={`absolute top-[12px] left-1/2 block -translate-x-1/2 ${SAMPLE_W}`}>
          <NavRows labels={list.slice(0, 1)} colors={c} />
          <span className="mt-rows block space-y-rows">
            {list.slice(1).map((text, i) => (
              <span
                key={i}
                {...(i === 0 ? { 'data-sample': true } : {})}
                className={`flex h-row items-center rounded-row px-row-x text-base leading-6 whitespace-nowrap ${i === 0 ? 'bg-(--rest) transition-colors group-hover:bg-(--on)' : ''}`}
                style={{ color: c.soft, ...(i === 0 ? ({ ...moving, '--rest': 'transparent', '--on': c.hover } as CSSProperties) : {}) }}
              >
                {text}
              </span>
            ))}
          </span>
        </span>,
      )
    case 'dialog': {
      // 버튼을 누르면 나타나는 창. 줄에 마우스를 올리면 화면을 가리는 막과 창이 이 움직임으로 나타난다. 문구는 버튼의 말과 창의 제목이다.
      const [action, title] = list
      return frame(
        'h-[160px]',
        <>
          {page}
          <span className={`absolute right-[12px] bottom-[12px] flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ background: c.primary, color: c.onPrimary }}>
            {action}
          </span>
          <span data-sample className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100" style={{ ...moving, background: `color-mix(in oklab, ${c.scrim} 40%, transparent)` }}>
            <span className={`block rounded-float p-dialog ${SAMPLE_W}`} style={{ background: c.surface, boxShadow: [`inset 0 0 0 1px ${c.line}`, shadows.dialog].filter(Boolean).join(', ') }}>
              <span className="block text-base leading-6 font-[650] break-words">{title}</span>
            </span>
          </span>
        </>,
      )
    }
    case 'toast':
      // 화면 아래에서 올라오는 알림. 줄에 마우스를 올리면 이 움직임으로 올라오며 나타난다.
      return frame(
        'h-[128px]',
        <>
          {page}
          <span className="absolute inset-x-0 bottom-[16px] flex justify-center">
            <span
              data-sample
              className={`flex h-control translate-y-[48px] items-center rounded-control px-bar-x whitespace-nowrap opacity-0 transition-[translate,opacity] group-hover:translate-y-0 group-hover:opacity-100 ${TEXT}`}
              style={{ ...moving, background: c.ink, color: c.surface, boxShadow: shadows.float }}
            >
              {list[0]}
            </span>
          </span>
        </>,
      )
    default:
      // 캔버스의 판. 왼쪽 메뉴에서 판을 누르면 캔버스가 그 판이 가운데에 오도록 미끄러져 간다. 줄에 마우스를 올리면 판이 이 움직임으로 가운데로 온다. 문구는 판의 제목이다.
      return frame(
        'h-[128px]',
        <span data-sample className="absolute top-[16px] left-[16px] block w-[96px] rounded-float p-box transition-transform group-hover:translate-x-[56px]" style={{ ...moving, background: c.surface, ...ring }}>
          {/* 판의 제목과 그 판의 값들. 문구는 제목, 값의 이름들의 차례다("의미 색, ink, canvas, hairline"). 값마다 색 견본과 이름을 그린다(의미 색 판의 줄). 회색 막대로 대신하지 않는다. */}
          <span className={`block whitespace-nowrap ${STRONG}`}>{list[0]}</span>
          {list.length > 1 && (
            <span className="mt-blocks block space-y-rows">
              {list.slice(1).map((name, i) => (
                <span key={i} className="flex items-center gap-row-inner text-xs leading-4 whitespace-nowrap" style={{ color: c.soft }}>
                  <span className="block size-[12px] shrink-0 rounded-tag" style={{ background: [c.ink, c.surface, c.line, c.selection][i % 4], boxShadow: `inset 0 0 0 1px ${c.line}` }} />
                  {name}
                </span>
              ))}
            </span>
          )}
        </span>,
        c.hover,
      )
  }
}

const sample = (kind: MotionKind) => (e: KindExample<MotionShape>, value: string, context: SampleContext) => <MotionSample kind={kind} shape={e.shape} value={value} context={context} words={e.words} />

/** 숫자를 칸에 적는 글자로. */
const digits = (n: number) => String(Math.round(n * 1000) / 1000)

export const MOTION_SPECS: Record<MotionKind, ValueSpec<MotionShape>> = {
  duration: {
    title: MOTION_TITLES.duration,
    shapes: MOTION_SHAPES,
    shown: (value) => value,
    sample: sample('duration'),
    classes: (short) => [`duration-${short}`],
    valueTitle: '시간',
    cells: [{ label: '시간', unit: 'ms', placeholder: '200' }],
    // 초로 적은 값(0.3s)도 ms 칸으로 읽는다. 고치면 ms로 적힌다.
    read: (value) => (Number.isNaN(msOf(value)) ? null : [digits(msOf(value))]),
    write: ([ms]) => (ms >= 0 ? `${ms}ms` : null),
    missing: '시간을 입력해 주세요.',
    namePlaceholder: 'fade',
    // 예전 앞머리(--duration-)는 Tailwind가 읽지 않아 클래스가 없다.
    legacy: (name) => !name.startsWith('--transition-duration-'),
  },
  ease: {
    title: MOTION_TITLES.ease,
    shapes: MOTION_SHAPES,
    // 곡선은 네 숫자로 적는다(시작 쪽 손잡이의 가로·세로, 끝 쪽 손잡이의 가로·세로). 낱말로 적은 값(ease-out)도 숫자로 보여 준다.
    shown: (value) => parseCurve(value)?.join(', ') ?? value,
    sample: sample('ease'),
    classes: (short) => [`ease-${short}`],
    valueTitle: '곡선',
    cells: [
      { label: '시작 가로', unit: '' },
      { label: '시작 세로', unit: '', negative: true },
      { label: '끝 가로', unit: '' },
      { label: '끝 세로', unit: '', negative: true },
    ],
    read: (value) => parseCurve(value)?.map(digits) ?? null,
    write: writeCurve,
    // 추가할 때는 네 숫자를 적게 하지 않고 흔히 쓰는 곡선 가운데서 고른다. 숫자는 만든 뒤에 패널에서 고친다.
    addField: (draft, setDraft) => <UsePicker label="곡선" options={CURVE_PRESETS} value={CURVE_PRESETS.find((p) => p.value === draft)?.id ?? null} nameWidth="w-picker-name" onChange={(id) => setDraft(CURVE_PRESETS.find((p) => p.id === id)!.value)} />,
    missing: '곡선을 골라 주세요.',
    namePlaceholder: 'fade',
  },
}
