// 움직임 판(시간, 이징, 지연, 애니메이션)의 예시와, 네 종류가 줄 목록·패널·추가 창에 넘기는 것.

import { useContext, type CSSProperties, type ReactNode } from 'react'
import { Bell, ChevronRight, LoaderCircle } from 'lucide-react'
import { ICON_STROKE } from './lib/icons'
import { KEYFRAMES, keyframesCss } from './lib/keyframes'
import { ANIMATE_SHAPES, CURVE_PRESETS, DELAY_SHAPES, MOTION_SHAPES, MOTION_TITLES, MOTION_WORDS, curvePresetOf, msOf, parseAnimation, parseCurve, parseSteps, writeAnimation, writeCurve, type Animation, type MotionKind, type MotionShape } from './lib/motion'
import type { KindExample } from './lib/kindnote'
import { SAMPLE_BAR, SAMPLE_W } from './lib/sample'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { NavRows } from './SampleParts'
import { CellsInput, type SampleContext, type ValueSpec } from './ValueBoard'
import { Field, Segmented, UsePicker } from './ui'

// 예시가 쓰는 움직임의 단계. 보여 주는 시스템의 파일에 적힌 것과 이름이 겹치지 않게 앞에 ffkf-를 붙여, FF 화면에 한 번만 넣는다.
const SAMPLE_KEYFRAMES = keyframesCss(KEYFRAMES.map((k) => k.id), 'ffkf-')

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/**
 * 그 시간과 곡선으로 실제로 움직이는 모습. 줄에 마우스를 올리면 움직이고, 떼면 같은 움직임으로 돌아간다.
 * 움직이는 것은 화면에서 실제로 움직이는 요소다. 캔버스에서 미끄러져 오는 판, 마우스를 올린 줄의 바탕, 나타나는 창, 올라오는 알림.
 * 시간의 예시는 그 시간으로(곡선은 브라우저의 기본), 이징의 예시는 그 곡선으로 움직인다. 곡선은 짧은 시간에는 눈에 보이지 않아서 0.8초로 늘려 보여 준다.
 * 지연의 예시는 그 시간만큼 기다렸다가 움직이기 시작하고(움직임 자체는 0.2초), 애니메이션의 예시는 줄에 마우스를 올린 동안 그 애니메이션으로 움직인다.
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
  // 애니메이션은 줄에 마우스를 올린 동안만 돈다(판에서 늘 돌면 눈이 거기로만 간다). 움직임의 이름은 FF 화면에 넣어 둔 단계의 이름으로 바꾼다.
  const play = { '--play': value.trim().replace(/^\S+/, (name) => `ffkf-${name}`) } as CSSProperties
  const PLAY = 'group-hover:animate-(--play)'
  const center = (body: ReactNode) => <span className="absolute inset-0 flex items-center justify-center">{body}</span>
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
      {kind === 'animate' && (
        <style href="ff-sample-keyframes" precedence="default">
          {SAMPLE_KEYFRAMES}
        </style>
      )}
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
    case 'fold':
      // 패널의 접히는 구역. 줄에 마우스를 올리면 화살표가 돌고 내용이 이 움직임으로 펼쳐진다. 문구는 구역의 제목과 그 안의 줄들이다.
      return frame(
        'h-[136px]',
        <span className={`absolute top-[16px] left-1/2 block -translate-x-1/2 ${SAMPLE_W}`}>
          <span className={`flex h-control items-center gap-row-inner whitespace-nowrap ${STRONG}`}>
            <ChevronRight size={16} strokeWidth={ICON_STROKE} className="shrink-0 transition-transform group-hover:rotate-90" style={moving} />
            {list[0]}
          </span>
          <span data-sample className="grid grid-rows-[0fr] transition-[grid-template-rows] group-hover:grid-rows-[1fr]" style={moving}>
            <span className="block min-h-0 overflow-hidden">
              {list.slice(1).map((text, i) => (
                <span key={i} className={`flex h-row items-center whitespace-nowrap ${TEXT}`} style={{ color: c.soft }}>
                  {text}
                </span>
              ))}
            </span>
          </span>
        </span>,
      )
    case 'scale':
      // 마우스를 올리면 살짝 커지는 카드. 문구는 카드의 제목과 그 아래의 글이다.
      return frame(
        'h-[128px]',
        center(
          <span data-sample className={`block rounded-float p-card transition-transform group-hover:scale-[1.06] ${SAMPLE_W}`} style={{ ...moving, background: c.surface, ...ring }}>
            <span className={`block break-words ${STRONG}`}>{list[0]}</span>
            {list[1] && (
              <span className="mt-label block text-xs leading-4 break-words" style={{ color: c.soft }}>
                {list[1]}
              </span>
            )}
          </span>,
        ),
      )
    case 'stagger':
      // 목록의 줄들. 줄에 마우스를 올리면 위에서부터 한 줄씩 이 지연만큼 늦게 또렷해진다(둘째 줄은 한 번, 셋째 줄은 두 번 기다린다).
      return frame(
        'h-[136px]',
        <span className={`absolute top-[12px] left-1/2 block -translate-x-1/2 space-y-rows ${SAMPLE_W}`}>
          {list.map((text, i) => (
            <span key={i} {...(i === 1 ? { 'data-sample': true } : {})} className={`flex h-row items-center rounded-row px-row-x whitespace-nowrap opacity-30 transition-opacity group-hover:opacity-100 ${TEXT}`} style={{ transitionDuration: '200ms', transitionDelay: `calc(${value} * ${i})`, ...ring }}>
              {text}
            </span>
          ))}
        </span>,
      )
    case 'hint': {
      // 버튼의 도움말. 줄에 마우스를 올리면 이 지연만큼 기다렸다가 도움말이 뜬다. 문구는 버튼의 말과 도움말이다.
      const [action, tip] = list
      return frame(
        'h-[128px]',
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-blocks">
          <span data-sample className="flex h-compact items-center rounded-control px-chip-x text-xs leading-4 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100" style={{ transitionDuration: '150ms', transitionDelay: value, background: c.ink, color: c.surface }}>
            {tip}
          </span>
          <span className={`flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ background: c.primary, color: c.onPrimary }}>
            {action}
          </span>
        </span>,
      )
    }
    case 'spinner':
      // 기다리는 동안의 버튼. 버튼 안의 표시가 이 애니메이션으로 돈다. 문구는 버튼의 말이다.
      return frame(
        'h-[96px]',
        center(
          <span className={`flex h-control items-center gap-button-inner rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ background: c.primary, color: c.onPrimary }}>
            <LoaderCircle data-sample size={16} strokeWidth={ICON_STROKE} className={`shrink-0 ${PLAY}`} style={play} />
            {list[0]}
          </span>,
        ),
      )
    case 'skeleton':
      // 불러오는 동안 내용의 자리를 대신하는 막대들. 여기서는 막대가 곧 보여 주려는 요소다.
      return frame(
        'h-[96px]',
        center(
          <span data-sample className={`block space-y-blocks ${SAMPLE_W} ${PLAY}`} style={play}>
            {bar('w-1/3')}
            {bar('w-full')}
            {bar('w-2/3')}
          </span>,
        ),
      )
    case 'dot':
      // 새 소식을 알리는 점. 점 뒤의 같은 색 점이 이 애니메이션으로 움직인다(퍼짐이면 고리처럼 번진다). 문구는 그 줄의 말이다.
      return frame(
        'h-[96px]',
        center(
          <span className={`flex h-row items-center gap-row-inner rounded-row px-row-x whitespace-nowrap ${TEXT}`} style={ring}>
            <span className="relative flex shrink-0">
              <Bell size={16} strokeWidth={ICON_STROKE} />
              <span data-sample className={`absolute -top-[2px] -right-[2px] block size-[6px] rounded-pill ${PLAY}`} style={{ ...play, background: c.selection }} />
              <span className="absolute -top-[2px] -right-[2px] block size-[6px] rounded-pill" style={{ background: c.selection }} />
            </span>
            {list[0]}
          </span>,
        ),
      )
    case 'enter':
      // 나타나는 알림. 줄에 마우스를 올리면 이 애니메이션으로 나타난다.
      return frame(
        'h-[128px]',
        <>
          {page}
          <span className="absolute inset-x-0 bottom-[16px] flex justify-center">
            <span data-sample className={`flex h-control items-center rounded-control px-bar-x whitespace-nowrap ${TEXT} ${PLAY}`} style={{ ...play, background: c.ink, color: c.surface, boxShadow: shadows.float }}>
              {list[0]}
            </span>
          </span>
        </>,
      )
    case 'field': {
      // 잘못 적은 입력칸. 줄에 마우스를 올리면 칸이 이 애니메이션으로 움직인다(흔들림). 문구는 이름표와 칸에 적힌 말이다.
      const [label, text] = list
      return frame(
        'h-[112px]',
        center(
          <span className={`block ${SAMPLE_W}`}>
            <span className={`mb-label block ${STRONG}`} style={{ color: c.faint }}>
              {label}
            </span>
            <span data-sample className={`flex h-control items-center rounded-control px-input-x whitespace-nowrap ${TEXT} ${PLAY}`} style={{ ...play, ...ring }}>
              {text}
            </span>
          </span>,
        ),
      )
    }
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

/** 시간 한 칸(ms). 시간, 지연, 애니메이션의 시간이 함께 쓴다. 초로 적은 값(0.3s)도 ms 칸으로 읽고, 고치면 ms로 적힌다. */
const TIME = {
  cells: [{ label: '시간', unit: 'ms', placeholder: '200' }],
  read: (value: string) => (Number.isNaN(msOf(value)) ? null : [digits(msOf(value))]),
  write: ([ms]: number[]) => (ms >= 0 ? `${ms}ms` : null),
}
const COUNT = {
  cells: [{ label: '횟수', unit: '번' }],
  read: (value: string) => (/^\d+$/.test(value) ? [value] : null),
  write: ([n]: number[]) => (Number.isInteger(n) && n > 0 ? String(n) : null),
}
const REPEATS: { id: 'infinite' | 'count'; label: string }[] = [
  { id: 'infinite', label: '계속' },
  { id: 'count', label: '횟수' },
]

/**
 * 애니메이션을 고치는 칸들. 움직임(준비된 것 가운데 하나), 한 번 도는 시간, 이징, 되풀이(계속이거나 정한 횟수).
 * 값을 글자로 통째로 적게 하면 낱말의 차례와 움직임의 이름을 외워야 한다. 이징이 준비된 곡선이 아니면 칸 아래에 적힌 그대로 보여 준다.
 */
function AnimationFields({ animation: a, onValue }: { animation: Animation; onValue: (value: string) => void }) {
  const set = (next: Partial<Animation>) => onValue(writeAnimation({ ...a, ...next }))
  const curve = curvePresetOf(a.ease)
  return (
    <div className="space-y-fields">
      <Field label="움직임" plain>
        <UsePicker label="움직임" options={KEYFRAMES} value={a.name} onChange={(name) => set({ name })} />
      </Field>
      <Field label="시간">
        <CellsInput spec={TIME} value={`${a.ms}ms`} onValue={(value) => msOf(value) > 0 && set({ ms: msOf(value) })} />
      </Field>
      <Field label="이징" plain hint={curve ? undefined : a.ease}>
        <UsePicker label="이징" options={CURVE_PRESETS} value={curve} onChange={(id) => set({ ease: CURVE_PRESETS.find((p) => p.id === id)!.value })} />
      </Field>
      <Field label="되풀이" plain>
        <div className="space-y-blocks">
          <Segmented label="되풀이" options={REPEATS} value={a.count === 'infinite' ? 'infinite' : 'count'} onChange={(repeat) => set({ count: repeat === 'infinite' ? 'infinite' : 1 })} />
          {a.count !== 'infinite' && <CellsInput spec={COUNT} value={String(a.count)} onValue={(value) => set({ count: Number(value) })} />}
        </div>
      </Field>
    </div>
  )
}

export const MOTION_SPECS: Record<MotionKind, ValueSpec<MotionShape>> = {
  duration: {
    title: MOTION_TITLES.duration,
    shapes: MOTION_SHAPES,
    shown: (value) => value,
    sample: sample('duration'),
    classes: (short) => [`duration-${short}`],
    valueTitle: '시간',
    ...TIME,
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
    // 끊기는 움직임(steps)은 곡선의 네 숫자가 아니라 단계 수 하나로 고친다. 끊는 자리(end, start)는 적혀 있던 그대로 둔다.
    fields: (value, onValue) => {
      const steps = parseSteps(value)
      if (!steps) return null
      const spec = {
        cells: [{ label: '단계 수', unit: '단계' }],
        read: (v: string) => (parseSteps(v) ? [String(parseSteps(v)!.count)] : null),
        write: ([n]: number[]) => (Number.isInteger(n) && n > 0 ? `steps(${n}, ${steps.at})` : null),
      }
      return (
        <Field label="단계 수">
          <CellsInput spec={spec} value={value} onValue={onValue} />
        </Field>
      )
    },
    // 추가할 때는 네 숫자를 적게 하지 않고 흔히 쓰는 곡선 가운데서 고른다. 숫자는 만든 뒤에 패널에서 고친다.
    addField: (draft, setDraft) => <UsePicker label="곡선" options={CURVE_PRESETS} value={CURVE_PRESETS.find((p) => p.value === draft)?.id ?? null} nameWidth="w-picker-name" onChange={(id) => setDraft(CURVE_PRESETS.find((p) => p.id === id)!.value)} />,
    missing: '곡선을 골라 주세요.',
    namePlaceholder: 'fade',
  },
  delay: {
    title: MOTION_TITLES.delay,
    shapes: DELAY_SHAPES,
    shown: (value) => value,
    sample: sample('delay'),
    classes: (short) => [`delay-${short}`],
    valueTitle: '시간',
    ...TIME,
    missing: '시간을 입력해 주세요.',
    namePlaceholder: 'stagger',
  },
  animate: {
    title: MOTION_TITLES.animate,
    shapes: ANIMATE_SHAPES,
    shown: (value) => value,
    sample: sample('animate'),
    classes: (short) => [`animate-${short}`],
    valueTitle: '애니메이션',
    // 숫자 칸만으로는 적을 수 없는 값이다. 읽을 수 있으면 아래의 칸들로, 아니면(준비되지 않은 움직임, 다른 꼴) 글자로 고친다.
    cells: [],
    read: () => null,
    write: () => null,
    fields: (value, onValue) => {
      const animation = parseAnimation(value)
      return animation ? <AnimationFields animation={animation} onValue={onValue} /> : null
    },
    // 추가할 때는 움직임만 고른다. 시간과 이징, 되풀이는 그 움직임에 맞는 값으로 채워지고, 만든 뒤에 패널에서 고친다.
    addTitle: '움직임',
    addField: (draft, setDraft) => <UsePicker label="움직임" options={KEYFRAMES} value={KEYFRAMES.find((k) => k.value === draft)?.id ?? null} onChange={(id) => setDraft(KEYFRAMES.find((k) => k.id === id)!.value)} />,
    missing: '움직임을 골라 주세요.',
    namePlaceholder: 'loading',
  },
}
