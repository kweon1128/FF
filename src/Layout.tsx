// 화면 크기 판(브레이크포인트, 컨테이너 폭, 비율)의 예시와, 세 종류가 줄 목록·패널·추가 창에 넘기는 것.

import { useContext, type ReactNode } from 'react'
import { Image as ImageIcon, Play } from 'lucide-react'
import { KINDS } from './lib/catalog'
import { ICON_STROKE } from './lib/icons'
import type { KindExample } from './lib/kindnote'
import { LAYOUT_NAMES, LAYOUT_TITLES, LAYOUT_WORDS, layoutShapes, parseRatio, pxOf, type LayoutKind, type LayoutShape } from './lib/screens'
import { SAMPLE_W } from './lib/sample'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { NavRows } from './SampleParts'
import { SizeSample, sampleScale } from './Sizes'
import type { SampleContext, ValueSpec } from './ValueBoard'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/** 화면 크기 판(560px)의 예시 칸에 들어가는 가장 큰 폭(px. 칸의 안쪽 폭 212에 반 픽셀의 여유를 두어 1700px이 8분의 1로 들어가게 한다). 이보다 넓은 화면과 페이지는 통째로 줄여 그린다. */
const FIT = 213

const WIDTH = KINDS.width

/** 그 폭을 몇 분의 일로 줄여 그리는지. */
const scaleOf = (value: string) => sampleScale(WIDTH, `${pxOf(value)}px`, undefined, FIT)
const scaleNote = (value: string) => (Number.isNaN(pxOf(value)) || scaleOf(value) === 1 ? '' : ` · 그림은 1/${scaleOf(value)}`)

/**
 * 폭의 예시. 의미 크기 판의 폭 예시와 같은 치수선을 쓴다(위쪽의 가로선과 숫자 이름표. 띠로 칠하지 않는다). 예시 칸보다 넓은 것은 통째로 줄여 그린다.
 * 브레이크포인트는 그 폭의 화면에서 어떤 배치가 되는지를 그린다. 나란히는 두 영역이 좌우로 놓인 모습, 옆 메뉴는 메뉴가 옆에 놓인 모습이다(그 폭보다 좁으면 위아래로 쌓이거나 메뉴가 접힌다).
 * 컨테이너 폭은 그 폭까지만 넓어지는 페이지나 창을 그린다(의미 크기 판의 창 예시와 같은 그림).
 */
function WidthSample({ shape, value, context, words: written = '' }: { shape: LayoutShape; value: string; context: SampleContext; words?: string }) {
  const { colors: c } = context
  const px = pxOf(value)
  if (Number.isNaN(px)) return null
  const around = c
  const words = written || LAYOUT_WORDS[shape]
  const list = words.split(', ').map((w) => w.trim())
  const ring = { boxShadow: `inset 0 0 0 1px ${c.line}` }
  if (shape === 'dialog') return <SizeSample kind={WIDTH} shape="frame" value={`${px}px`} fit={FIT} around={around} tint={c.selection} words={words} />
  // 줄여 그린 그림 안에서도 글자는 제 크기로 읽히게 한다(치수선의 이름표와 같다). 글자에만 zoom을 되돌린다.
  const text = (label: string, scale: number, more = '') => (
    <span className={`block text-sm leading-5 font-[550] whitespace-nowrap ${more}`} style={{ zoom: scale }}>
      {label}
    </span>
  )
  // 영역 하나. 문구는 "제목=내용"으로 적는다("단계=xs 12px · sm 14px"). 제목은 진하게, 내용은 그 영역에 실제로 적혀 있는 말을 옅게 적는다.
  // 내용을 적지 않은 영역은 제목만 그린다. 회색 막대로 대신하지 않는다.
  const pane = (item: string, scale: number, more = '') => {
    const cut = item.indexOf('=')
    const label = cut === -1 ? item : item.slice(0, cut).trim()
    const body = cut === -1 ? '' : item.slice(cut + 1).trim()
    return (
      <span className={`block min-w-0 ${more}`} style={{ padding: 12 * scale }}>
        {text(label, scale)}
        {body && (
          <span className="mt-label block text-xs leading-4 break-words" style={{ zoom: scale, color: c.soft }}>
            {body}
          </span>
        )}
      </span>
    )
  }
  const custom = (fill: string, scale: number): ReactNode => {
    if (shape === 'sidebar')
      // 메뉴가 옆에 놓인 화면. 첫 문구들이 메뉴의 줄이고 마지막 문구가 그 옆 영역의 이름이다.
      return (
        <span className={`${fill} flex items-stretch`} style={{ ...ring, height: 96 * scale }}>
          <span className="block shrink-0" style={{ width: '30%', padding: 8 * scale, boxShadow: `inset -1px 0 0 ${c.line}` }}>
            <span className="block" style={{ zoom: scale * 0.75 }}>
              <NavRows labels={list.slice(0, -1)} colors={c} />
            </span>
          </span>
          {pane(list.at(-1) ?? '', scale, 'flex-1')}
        </span>
      )
    if (shape === 'page')
      // 그 폭까지만 넓어지는 페이지. 맨 위에 제목이 있고 그 아래 내용은 자리만 알린다.
      return (
        <span className={`${fill} block`} style={ring}>
          {pane(list[0] ?? '', scale)}
        </span>
      )
    // 나란히: 두 영역이 좌우로 놓인 화면. 문구는 두 영역의 이름이다.
    return (
      <span className={`${fill} flex items-stretch`} style={{ ...ring, height: 96 * scale }}>
        {pane(list[0] ?? '', scale, 'flex-1')}
        <span className="block shrink-0" style={{ width: scale, background: c.line }} />
        {pane(list[1] ?? '', scale, 'flex-1')}
      </span>
    )
  }
  return <SizeSample kind={WIDTH} shape="frame" value={`${px}px`} fit={FIT} around={around} tint={c.selection} custom={custom} />
}

/**
 * 비율의 예시. 그 비율의 칸에 놓이는 것을 그린다. 이미지는 사진이 들어갈 칸(사진이 아직 없을 때의 모습), 동영상은 재생 버튼이 있는 칸, 카드는 위에 사진 칸이 있고 아래에 제목이 있는 카드다.
 * 칸의 폭은 예시의 기본 폭이고 높이가 비율에서 나온다.
 */
function RatioSample({ shape, value, context, words: written = '' }: { shape: LayoutShape; value: string; context: SampleContext; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const { colors: c } = context
  const ratio = parseRatio(value)
  if (!ratio) return null
  const words = written || LAYOUT_WORDS[shape]
  const media = (
    <span data-sample className="flex w-full items-center justify-center" style={{ aspectRatio: `${ratio[0]} / ${ratio[1]}`, background: shape === 'video' ? c.ink : c.hover, color: shape === 'video' ? c.surface : c.faint }}>
      {shape === 'video' ? <Play size={24} strokeWidth={ICON_STROKE} /> : <ImageIcon size={24} strokeWidth={ICON_STROKE} />}
    </span>
  )
  return (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-card p-sample ${EDGE}`} style={{ ...space, background: c.surface, color: c.ink, fontFamily: font }}>
      {shape === 'card' ? (
        <span className={`block overflow-hidden rounded-card ${SAMPLE_W}`} style={{ boxShadow: `inset 0 0 0 1px ${c.line}` }}>
          {media}
          <span className="block px-box py-box text-sm leading-5 font-[550] break-words">{words}</span>
        </span>
      ) : (
        <span className={`block overflow-hidden rounded-card ${SAMPLE_W}`}>{media}</span>
      )}
    </span>
  )
}

const widthSample = (e: KindExample<LayoutShape>, value: string, context: SampleContext) => <WidthSample shape={e.shape} value={value} context={context} words={e.words} />

/** 숫자를 칸에 적는 글자로. */
const digits = (n: number) => String(Math.round(n * 1000) / 1000)

/** 폭을 적는 칸. px로 적는다. rem으로 적힌 값(48rem)도 px 칸으로 읽고, 고치면 px로 적힌다. */
const widthCells = {
  valueTitle: '너비',
  cells: [{ label: '너비', unit: 'px', placeholder: '768' }],
  read: (value: string) => (Number.isNaN(pxOf(value)) ? null : [digits(pxOf(value))]),
  write: ([px]: number[]) => (px > 0 ? `${px}px` : null),
  missing: '너비를 입력해 주세요.',
  // Tailwind의 이름(2xl, 3xl)을 쓰므로 숫자로 시작해도 된다.
  digitNames: true,
  scaleNote,
}

export const LAYOUT_SPECS: Record<LayoutKind, ValueSpec<LayoutShape>> = {
  breakpoint: {
    title: LAYOUT_TITLES.breakpoint,
    shapes: layoutShapes('breakpoint'),
    shapeNames: LAYOUT_NAMES,
    shown: (value) => value,
    sample: widthSample,
    // 이름이 곧 코드에 적는 앞머리다(md:flex). 그 폭 아래는 max-이름:이다.
    classes: (short) => [`${short}:`, `max-${short}:`],
    namePlaceholder: 'md',
    ...widthCells,
  },
  container: {
    title: LAYOUT_TITLES.container,
    shapes: layoutShapes('container'),
    shapeNames: LAYOUT_NAMES,
    shown: (value) => value,
    sample: widthSample,
    // 최대 폭으로도, 컨테이너의 폭을 보고 바꾸는 앞머리로도 쓴다(@container 안에서 @md:flex).
    classes: (short) => [`max-w-${short}`, `@${short}:`],
    namePlaceholder: 'md',
    // w-이름과 max-w-이름은 의미 크기의 폭(--width-이름)도 읽는다. 같은 이름이 둘 다 있으면 어느 값이 쓰일지 알 수 없다.
    nameProblem: (name, tokens) => (tokens.some((t) => t.name === `--width-${name}`) ? '같은 이름의 너비(의미 크기)가 있어서 쓸 수 없어요.' : null),
    ...widthCells,
  },
  aspect: {
    title: LAYOUT_TITLES.aspect,
    shapes: layoutShapes('aspect'),
    shapeNames: LAYOUT_NAMES,
    // "16 / 9"를 16:9로 적는다. 사람이 읽는 것은 그 꼴이다.
    shown: (value) => parseRatio(value)?.join(':') ?? value,
    sample: (e, value, context) => <RatioSample shape={e.shape} value={value} context={context} words={e.words} />,
    classes: (short) => [`aspect-${short}`],
    valueTitle: '비율',
    cells: [
      { label: '가로', unit: '', placeholder: '16' },
      { label: '세로', unit: '', placeholder: '9' },
    ],
    read: (value) => parseRatio(value)?.map(digits) ?? null,
    write: ([w, h]) => (w > 0 && h > 0 ? `${w} / ${h}` : null),
    missing: '가로와 세로를 입력해 주세요.',
    namePlaceholder: 'video',
  },
}
