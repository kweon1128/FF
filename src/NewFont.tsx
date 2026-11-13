import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { SLUG } from './lib/catalog'
import { Check, Minus, Plus, X } from 'lucide-react'
import { ColorSwatch } from './ColorPicker'
import { CATALOG, FALLBACKS, commonFonts, fontValue, loadCatalog, nameForFont, parseFontValue, inkShift, recordFont, systemFamilies, typeOfFont, weightsOf } from './lib/fonts'
import { Button, inputClass } from './ui'

/** 한 묶음에서 한 번에 그리는 글꼴의 수. 줄마다 그 글꼴로 그리므로 너무 많으면 느려진다. 더 찾으려면 이름을 적어 좁힌다. */
const MAX_ROWS = 80
/** 나란히 견주는 후보의 수. */
const SLOTS = 3
const LOCAL = '내 컴퓨터'
const SYSTEM = '이 시스템의 글꼴'
/** 창을 열었을 때의 본문 글자 크기(px). 모양의 차이가 잘 보이도록 실제 본문보다 조금 크게 시작한다. */
const SIZE_START = 17
/** 견본의 본문 글자 크기를 바꿔 볼 수 있는 범위(px). 본문으로 실제 쓰이는 크기다. 12px 아래는 보조 글자, 20px 위는 제목의 영역이다. */
const SIZE_MIN = 12
const SIZE_MAX = 20
/** 굵기 줄의 자리들. 글꼴에 없는 굵기도 자리는 비워 둔 채 남겨서, 나란히 놓은 견본끼리 같은 굵기가 같은 높이에 오게 한다. */
const WEIGHT_SLOTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]
/** 견본의 줄 수: 큰 제목, 작은 제목, 본문, 작은 글자, 굵기 아홉 줄, 버튼과 입력칸, 숫자 두 줄, 헷갈리는 글자. */
/** 견본의 줄 수: 큰 제목, 작은 제목, 본문, 작은 글자, 굵기 한 줄, 버튼 두 줄, 입력칸, 숫자 두 줄, 헷갈리는 글자. */
const SAMPLE_ROWS = 11
/** 부모 격자의 줄을 그대로 물려받는 격자. 부모가 격자가 아니면 그냥 위에서부터 쌓인다. */
const SUBGRID = 'grid [grid-template-rows:subgrid]'
/** 카드는 이름 한 줄과 견본의 줄들을 차지한다. */
const CARD_ROWS = { gridRow: `span ${SAMPLE_ROWS + 1}` }
/**
 * 견본의 한 줄. 높이는 줄 높이 그대로 고정이고 줄을 바꾸지 않는다.
 * 글자는 줄 상자의 위아래 여백을 잘라 내고(대문자 높이에서 기준선까지만 남김) 줄의 가운데에 놓는다. 글꼴마다 글자 위아래에 잡아 둔
 * 여백이 달라서 그대로 두면 같은 줄인데도 어떤 글꼴은 1~2px 위에, 어떤 글꼴은 아래에 앉는다. 나란히 견줄 때 그 차이가 글꼴의 모양보다 먼저 보인다.
 */
const LINE = 'h-[1lh] whitespace-nowrap content-center [text-box:trim-both_cap_alphabetic]'
/** 견본에서 상자 안에 들어가는 글들(버튼 셋과 입력칸). 글자의 실제 모양을 재서 상자의 한가운데에 놓는다. */
const BOXED = ['저장하기', '취소', '더 보기', '임시 저장', '비활성', '이름을 입력하세요']
const LABEL = 'shrink-0 text-sm font-[550] whitespace-nowrap text-ink-faint'
const SCALE_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent'
/**
 * 버튼과 입력칸 안의 글자에 준다. 글꼴마다 글자 위아래에 잡아 둔 여백이 달라서, 그대로 가운데에 놓으면 글꼴에 따라
 * 위나 아래로 1~2px 치우친다. 줄 상자에서 그 여백을 잘라 내고(대문자 높이에서 기준선까지만 남김) 글자 자체를 가운데에 놓는다.
 */
const TRIM = 'block [text-box:trim-both_cap_alphabetic]'

/** 견본을 그릴 때 따르는 이 디자인 시스템의 값들. 글자 크기와 줄 높이(작은 것부터), 기본 글자색과 바탕색. */
/** 글자색과 바탕색의 한 조합. 견본의 색을 한 번에 바꿀 때 쓴다. */
export type SamplePair = { name: string; ink: string; surface: string }
export type SampleLook = { sizes: { size: string; line: string }[]; ink: string; surface: string; pairs?: SamplePair[] }
export const SampleContext = createContext<SampleLook>({ sizes: [], ink: '#000000', surface: '#ffffff' })

/** 글자 크기가 아직 하나도 없는 시스템에서 쓰는 크기들. */
const FALLBACK_SIZES = [
  { size: '12px', line: '16px' },
  { size: '14px', line: '20px' },
  { size: '16px', line: '24px' },
  { size: '24px', line: '32px' },
]

/**
 * 그 굵기를 청했을 때 실제로 그려지는 굵기. 글꼴에 그 굵기가 없으면 브라우저가 가까운 것을 대신 고르는데, 그 규칙을 그대로 따른다.
 * 400~500을 청하면 500까지 위로 찾고, 없으면 아래로, 그래도 없으면 더 위로 찾는다. 400보다 얇으면 아래를 먼저, 500보다 굵으면 위를 먼저 찾는다.
 */
export function shownWeight(weights: number[], want: number) {
  if (weights.length === 0 || weights.includes(want)) return want
  const below = weights.filter((w) => w < want).sort((a, b) => b - a)
  const above = weights.filter((w) => w > want).sort((a, b) => a - b)
  if (want >= 400 && want <= 500) return above.find((w) => w <= 500) ?? below[0] ?? above[0]
  return want < 400 ? (below[0] ?? above[0]) : (above[0] ?? below[0])
}

/** 견본의 본문 글자 크기(px). 이 시스템의 글자 크기 가운데 두 번째로 작은 것이다. */
export function bodySize(look: SampleLook) {
  const sizes = look.sizes.length > 0 ? look.sizes : FALLBACK_SIZES
  const size = sizes[Math.min(1, sizes.length - 1)].size
  return parseFloat(size) * (size.trim().endsWith('rem') ? 16 : 1) || 14
}

/**
 * 글꼴이 쓰인 모습. 글꼴은 문장 한 줄로는 차이가 보이지 않아서, 실제 화면에서 만나는 자리들에 놓아 보여 준다.
 * 큰 제목, 작은 제목, 본문 문단, 작은 글자, 굵기들, 버튼과 입력칸, 숫자, 헷갈리기 쉬운 글자의 순서다.
 * 문단 말고는 줄이 바뀌지 않게 짧은 글을 쓴다. 줄이 바뀌면 글꼴마다 줄 수가 달라져 같은 자리끼리 견줄 수 없다.
 *
 * 글자 크기와 줄 높이는 이 디자인 시스템의 글자 크기 값을 따른다. 가장 작은 것이 작은 글자, 그다음이 본문, 그다음이 작은 제목,
 * 가장 큰 것이 큰 제목이다. 색도 이 시스템의 기본 글자색과 바탕색이고, ink와 surface를 주면 그 색으로 그린다.
 * weights는 이 글꼴에 들어 있는 굵기들. scale은 보기만 키우거나 줄이는 비율이다.
 */
export function FontSample({
  family,
  weights = [400, 700],
  ink,
  surface,
  scale = 1,
  weight = 400,
  className = '',
}: {
  family: string
  weights?: number[]
  ink?: string
  surface?: string
  scale?: number
  /** 읽는 글(본문, 작은 글자, 숫자)의 굵기. 제목과 버튼은 제 굵기 그대로다. */
  weight?: number
  className?: string
}) {
  const look = useContext(SampleContext)
  const sizes = look.sizes.length > 0 ? look.sizes : FALLBACK_SIZES
  const type = (i: number) => {
    const step = sizes[Math.min(i, sizes.length - 1)]
    return { fontSize: step.size, lineHeight: step.line }
  }
  const small = type(0)
  const body = type(1)
  const sub = type(2)
  const title = type(sizes.length - 1)
  const text = ink ?? look.ink
  const back = surface ?? look.surface
  // 읽는 글에 입히는 굵기와, 이 글꼴에 그 굵기가 없을 때 실제로 그려지는 굵기.
  const read = { fontWeight: weight }
  const drawn = shownWeight(weights, weight)
  // 글꼴이 불려 온 뒤에 한 번 더 그린다. 불려 오기 전에 잰 글자 모양은 대체 글꼴의 것이라 맞지 않는다.
  const [, setLoaded] = useState(0)
  useEffect(() => {
    let alive = true
    // 한글 글꼴은 글자 묶음별로 나뉘어 있어서, 견본에 실제로 쓰는 글자들을 청해야 그 묶음이 불려 온다.
    Promise.all([600, 700, weight].map((w) => document.fonts.load(`${w} 16px ${family}`, BOXED.join('') + 'H')))
      .then(() => alive && setLoaded((n) => n + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [family, weight])
  /** 상자 안의 글을 그 글자의 실제 모양 기준으로 한가운데에 놓는다. 대문자 기준으로 잡힌 자리에서, 모양이 치우친 만큼 되돌린다. */
  const centered = (label: string, w: number) => ({ translate: `0 ${inkShift(family, w, label).toFixed(4)}em` })
  return (
    // 견본의 줄 하나하나가 격자의 한 줄이다. 나란히 놓은 카드들이 같은 격자의 줄을 함께 쓰면(subgrid), 글꼴마다 줄이 차지하는
    // 높이가 조금씩 달라도 같은 줄이 정확히 같은 높이에 온다. 혼자 그려질 때(패널)는 그냥 위에서부터 쌓인다.
    <div className={`${SUBGRID} ${className}`} style={{ gridRow: `span ${SAMPLE_ROWS}`, fontFamily: family, color: text, background: back, zoom: scale }}>
      {/* 모든 줄은 높이를 줄 높이 그대로 고정한다(1lh). 글꼴마다 글자가 차지하는 높이가 달라 줄 상자가 1~2px씩 커지는데, 그대로 두면 글꼴을 바꿀 때마다 아래 줄들이 밀린다. */}
      <p className={`${LINE} font-bold`} style={title}>
        오늘 할 일
      </p>
      <p className={`mt-1 ${LINE} font-semibold`} style={sub}>
        디자인 값을 한곳에
      </p>
      {/* 문단은 글꼴의 폭에 따라 줄 수가 달라진다. 줄 수를 글꼴이 아니라 크기에 따라 정해 두어서(기본 크기에서 네 줄, 키우면 그만큼 더), 글꼴을 바꿔도 아래 줄들이 움직이지 않고 글도 잘리지 않는다. */}
      {/* 문단도 첫 줄의 글자 높이를 다른 글꼴과 맞춘다. 첫 줄의 위 여백을 잘라 내고, 줄 높이와 대문자 높이의 차이의 절반만큼 다시 띄운다. */}
      <p className="mt-2 box-border overflow-hidden pt-[calc((1lh-1cap)/2)] [text-box:trim-start_cap_alphabetic]" style={{ ...body, ...read, height: `calc(${Math.ceil(3.2 * scale)} * 1lh)` }}>
        색과 글꼴, 간격처럼 화면을 이루는 값을 한곳에 모아 둡니다. Design tokens keep every screen consistent.
      </p>
      <p className={`mt-2 ${LINE} opacity-70`} style={{ ...small, ...read }}>
        3분 전에 저장됨 · 값 12개
      </p>
      {/* 이 글꼴에 굵기가 몇 단계 있는지. 100부터 900까지 아홉 칸이 한 줄이고, 칸마다 그 굵기로 쓴 글자와 숫자가 있다.
          없는 굵기는 숫자만 아주 옅게 남긴다. 지금 읽는 글이 실제로 그려지고 있는 굵기의 칸을 밑줄로 표시한다(청한 굵기가 없으면 대신 그려지는 굵기). */}
      <div data-weights className="mt-4 grid grid-cols-9">
        {WEIGHT_SLOTS.map((w) => {
          const has = weights.includes(w)
          return (
            <span key={w} data-weight={w} data-has={has} data-on={w === drawn} className="text-center">
              <span className="block h-[1lh] content-center whitespace-nowrap [text-box:trim-both_cap_alphabetic]" style={{ ...sub, fontWeight: w }}>
                {has ? '가' : '\u00a0'}
              </span>
              <span
                className={`mx-auto block w-fit border-b font-mono text-[10px] leading-4 ${has ? 'opacity-60' : 'opacity-20'}`}
                style={{ borderColor: w === drawn ? 'currentColor' : 'transparent' }}
              >
                {w}
              </span>
            </span>
          )
        })}
      </div>
      {/* 버튼 셋: 주요 버튼(글자색을 바탕으로, 바탕색을 글자로 뒤집음), 보조 버튼(테두리만), 투명 버튼(글자만). 버튼마다 글자가 놓이는 조건이 달라서 함께 본다. */}
      <div data-controls className="mt-4 flex gap-1.5">
        <span className="inline-flex h-7 shrink-0 items-center rounded-md px-2.5 font-bold" style={{ fontSize: body.fontSize, background: text, color: back }}>
          <span className={TRIM} style={centered('저장하기', 700)}>
            저장하기
          </span>
        </span>
        <span
          className="inline-flex h-7 shrink-0 items-center rounded-md px-2.5 font-semibold"
          style={{ fontSize: body.fontSize, border: `1px solid color-mix(in srgb, ${text} 25%, transparent)` }}
        >
          <span className={TRIM} style={centered('취소', 600)}>
            취소
          </span>
        </span>
        <span className="inline-flex h-7 shrink-0 items-center rounded-md px-2 font-semibold" style={{ fontSize: body.fontSize }}>
          <span className={TRIM} style={centered('더 보기', 600)}>
            더 보기
          </span>
        </span>
      </div>
      {/* 둘째 줄: 연한 배경 버튼(글자색을 옅게 깐 바탕), 비활성 버튼(주요 버튼을 흐리게). 옅어진 상태에서도 글자가 읽히는지 본다. */}
      <div data-controls className="mt-2 flex gap-1.5">
        <span
          className="inline-flex h-7 shrink-0 items-center rounded-md px-2.5 font-semibold"
          style={{ fontSize: body.fontSize, background: `color-mix(in srgb, ${text} 10%, transparent)` }}
        >
          <span className={TRIM} style={centered('임시 저장', 600)}>
            임시 저장
          </span>
        </span>
        <span className="inline-flex h-7 shrink-0 items-center rounded-md px-2.5 font-bold opacity-40" style={{ fontSize: body.fontSize, background: text, color: back }}>
          <span className={TRIM} style={centered('비활성', 700)}>
            비활성
          </span>
        </span>
      </div>
      <div data-input className="mt-2 flex">
        <span
          className="flex h-7 min-w-0 flex-1 items-center rounded-md px-2"
          style={{ fontSize: body.fontSize, ...read, border: `1px solid color-mix(in srgb, ${text} 20%, transparent)` }}
        >
          <span className={`${TRIM} opacity-60`} style={centered('이름을 입력하세요', weight)}>
            이름을 입력하세요
          </span>
        </span>
      </div>
      <p className={`mt-4 ${LINE}`} style={{ ...body, ...read }}>
        12,345,678원
      </p>
      <p className={LINE} style={{ ...body, ...read }}>
        2026.11.13 09:41
      </p>
      <p className={`mt-1 ${LINE} opacity-70`} style={{ ...body, ...read }}>
        Il1 O0 rn · 똠방각하
      </p>
    </div>
  )
}

/**
 * 글꼴 종류를 만들거나 바꾸는 양식. 후보 글꼴을 몇 개 골라 같은 견본으로 나란히 견주어 보고 하나를 정한다.
 * 정할 것은 글꼴 하나뿐이다. 이름은 고른 글꼴의 갈래로 붙이고(sans, serif, mono), 대체 글꼴도 갈래에 맞춰 붙인다.
 * edit을 주면 이미 있는 글꼴 종류의 글꼴을 바꾸는 것이라 이름은 그대로고, 지금 글꼴이 첫 후보로 들어가 있다.
 */
export function NewFontForm({
  existing,
  edit,
  onCreate,
  onCancel,
}: {
  /** 이미 있는 글꼴 종류의 이름들(sans, mono 등). */
  existing: Set<string>
  edit?: { name: string; value: string }
  onCreate: (name: string, value: string) => void
  onCancel: () => void
}) {
  const [start] = useState(() => (edit ? parseFontValue(edit.value) : null))
  const [query, setQuery] = useState('')
  // 견주어 볼 후보들과, 그 가운데 정한 것. 정한 것이 없으면 첫 후보다.
  // 세 자리. 후보를 빼면 그 자리만 비고, 옆의 후보가 당겨지지 않는다. 새 후보는 가장 앞의 빈 자리에 들어간다.
  const [places, setPlaces] = useState<(string | null)[]>(() => Array.from({ length: SLOTS }, (_, i) => (i === 0 && start?.font ? start.font : null)))
  const cands = places.filter((f): f is string => f !== null)
  // 카드를 좌우로 끌어 자리를 바꾼다. from은 끌기 시작한 자리, over는 지금 놓으면 들어갈 자리, dx는 끈 거리.
  const [drag, setDrag] = useState<{ from: number; over: number; dx: number } | null>(null)
  const grid = useRef<HTMLDivElement>(null)
  // 창 안의 빈 곳(제목 옆, 여백, 빈 자리, 카드 사이)을 누르면 정한 것을 푼다. 캔버스에서 빈 곳을 누르면 선택이 풀리는 것과 같다.
  // 버튼, 입력칸, 목록의 줄, 카드를 누른 것은 빈 곳이 아니다. 이 창 위에 뜬 색 선택 창은 이 창의 바깥이라 해당하지 않는다.
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const dialog = form.current?.closest('[role="dialog"]')
      if (!dialog?.contains(target)) return
      if (!target.closest('button, input, label, [role="button"], [role="option"]')) setChosen(null)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])
  const grip = useRef<{ from: number; x: number; step: number; moved: boolean } | null>(null)

  function startDrag(e: ReactPointerEvent<HTMLDivElement>, from: number) {
    // 빼기 버튼을 누른 것이면 끌지 않는다.
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || !grid.current) return
    const cell = grid.current.children[0]?.getBoundingClientRect()
    const next = grid.current.children[1]?.getBoundingClientRect()
    if (!cell || !next) return
    grip.current = { from, x: e.clientX, step: next.left - cell.left, moved: false }
  }

  function moveDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const g = grip.current
    if (!g) return
    const raw = e.clientX - g.x
    // 조금 움직인 것은 누른 것으로 본다.
    if (!g.moved && Math.abs(raw) < 6) return
    // 끌기로 정해진 뒤에야 포인터를 붙잡는다. 누르자마자 붙잡으면 그냥 누른 것(정하기)이 안쪽까지 전해지지 않는다.
    if (!g.moved) e.currentTarget.setPointerCapture(e.pointerId)
    g.moved = true
    // 카드가 세 자리 밖으로 나가지 않게 한다.
    const dx = Math.max(-g.from * g.step, Math.min((SLOTS - 1 - g.from) * g.step, raw))
    setDrag({ from: g.from, dx, over: Math.round(g.from + dx / g.step) })
  }

  function endDrag() {
    const g = grip.current
    grip.current = null
    if (!g?.moved || !drag) return setDrag(null)
    // 놓은 자리의 카드(또는 빈 자리)와 맞바꾼다.
    if (drag.over !== drag.from) setPlaces(places.map((f, i) => (i === drag.from ? places[drag.over] : i === drag.over ? places[drag.from] : f)))
    setDrag(null)
    // 끌고 난 직후의 클릭이 "정하기"로 읽히지 않게, 클릭이 지나갈 때까지 끌었다는 표시를 남긴다.
    justDragged.current = true
    window.setTimeout(() => (justDragged.current = false), 0)
  }
  const justDragged = useRef(false)
  /** 끄는 동안 자리 i의 것이 옮겨져 보일 거리. 끄는 카드는 손을 따라가고, 놓일 자리에 있던 것은 끄는 카드의 원래 자리로 비켜난다. */
  const shift = (i: number) => {
    if (!drag || !grip.current) return undefined
    if (i === drag.from) return `translateX(${drag.dx}px)`
    if (i === drag.over) return `translateX(${(drag.from - drag.over) * grip.current.step}px)`
    return undefined
  }
  // 바꾸는 창에서는 지금 글꼴이 정해진 채로 시작한다.
  const [chosen, setChosen] = useState<string | null>(start?.font || null)
  // 이 컴퓨터의 글꼴들. 깔린 전부가 아니라 흔한 글꼴 가운데 이 컴퓨터에 있는 것들이다. 그 밖의 글꼴은 이름을 적어서 후보로 넣는다.
  const [local] = useState(commonFonts)
  // 이 시스템의 fonts.css에 들어 있는 글꼴들. AI가 넣은 글꼴과, 전에 골라서 적어 둔 추천 글꼴이다.
  const [own] = useState(systemFamilies)
  const [error, setError] = useState<string | null>(null)
  // 이름은 고른 글꼴의 갈래로 미리 채워 둔다. 직접 고치기 전까지는 글꼴을 바꿀 때마다 따라 바뀐다.
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  // 견본을 보는 방식: 글자색과 바탕색(처음에는 이 시스템의 기본 색), 크기 비율. 창을 닫으면 처음으로 돌아간다.
  const look = useContext(SampleContext)
  const [ink, setInk] = useState(look.ink)
  const [surface, setSurface] = useState(look.surface)
  // 견본의 본문 글자 크기(px). 처음에는 이 시스템의 본문 크기이고, 바꾸면 견본 전체가 같은 비율로 커지거나 작아진다.
  const baseSize = bodySize(look)
  // 읽는 글의 굵기. 크기처럼 바꿔 가며 본다.
  const [weight, setWeight] = useState(400)
  const stepWeight = (dir: 1 | -1) => setWeight(Math.max(100, Math.min(900, weight + dir * 100)))
  const [size, setSize] = useState(SIZE_START)
  const stepSize = (dir: 1 | -1) => setSize(Math.max(SIZE_MIN, Math.min(SIZE_MAX, size + dir)))
  const scale = size / baseSize

  useEffect(() => {
    loadCatalog()
  }, [])

  // 카드를 눌러 정한 글꼴. 누르기 전에는 어느 카드도 정해진 것으로 표시하지 않는다.
  const marked = chosen && cands.includes(chosen) ? chosen : ''
  // 만들어질 글꼴. 후보가 하나뿐이면 누르지 않아도 그것이다(고를 것이 없으므로). 둘 이상이면 눌러서 정해야 한다.
  const picked = marked || (cands.length === 1 ? cands[0] : '')
  const autoName = picked ? nameForFont(picked, existing) : ''

  // 대체 글꼴은 갈래에 맞춰 붙인다. 바꾸는 중이고 사용자가 손수 적어 둔 대체 글꼴이 있으면 그것을 지킨다.
  const auto = Object.values(FALLBACKS)
  const tailOf = (family: string) => {
    if (start && (family === start.font || (start.tail && !auto.includes(start.tail)))) return start.tail
    return FALLBACKS[typeOfFont(family)]
  }
  const valueOf = (family: string) => fontValue(family, tailOf(family))
  const value = picked ? valueOf(picked) : ''

  // 목록: 추천 글꼴을 성격별로, 그 아래에 이 컴퓨터의 글꼴(추천에 이미 있는 것은 뺀다).
  const typed = query.trim().toLowerCase()
  const hit = (family: string) => !typed || family.toLowerCase().includes(typed)
  const groups = new Map<string, string[]>()
  // 맨 위는 이 시스템의 글꼴. 같은 글꼴이 아래 묶음에 또 나오지 않게 한다.
  const mineFirst = own.filter(hit)
  if (mineFirst.length > 0) groups.set(SYSTEM, mineFirst)
  for (const f of CATALOG) if (hit(f.family) && !own.includes(f.family)) groups.set(f.group, [...(groups.get(f.group) ?? []), f.family])
  const inCatalog = new Set(CATALOG.map((f) => f.family))
  const mine = local.filter((f) => !inCatalog.has(f) && !own.includes(f) && hit(f))
  if (mine.length > 0) groups.set(LOCAL, mine.slice(0, MAX_ROWS))

  function toggle(family: string) {
    setError(null)
    if (cands.includes(family)) return setPlaces(places.map((f) => (f === family ? null : f)))
    // 자리가 다 찼으면 더 넣지 않는다. 있던 후보가 저절로 빠지고 바뀌지 않게, 카드를 빼서 자리를 낸 뒤에 넣는다.
    const empty = places.indexOf(null)
    if (empty >= 0) setPlaces(places.map((f, i) => (i === empty ? family : f)))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!picked) return setError(cands.length > 0 ? '카드를 눌러 글꼴을 정해 주세요.' : '글꼴을 골라 주세요.')
    if (/[;{}]/.test(value)) return setError('; { } 가 든 이름은 쓸 수 없어요.')
    // 이름 칸을 비워 두면 미리 채워 주던 이름을 쓴다. 이름은 꼭 적지 않아도 된다.
    const name = edit ? edit.name : (nameDraft ?? '').trim() || autoName
    if (!edit && name !== autoName) {
      if (!SLUG.test(name)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
      // --font-weight-로 시작하면 굵기로 읽힌다.
      if (name === 'weight' || name.startsWith('weight-')) return setNameError('weight로 시작하는 이름은 굵기에 쓰여요.')
      if (existing.has(name)) return setNameError('같은 이름의 글꼴 종류가 이미 있어요.')
    }
    // 추천 글꼴이면 불러오는 주소를 시스템의 fonts.css에 적어 둔다.
    void recordFont(picked)
    onCreate(name, value)
  }

  const row = (family: string) => {
    const on = cands.includes(family)
    // 자리가 다 찼으면 후보가 아닌 줄은 누를 수 없고 옅게 보인다.
    const full = !on && cands.length >= SLOTS
    return (
      <button
        key={family}
        type="button"
        role="option"
        aria-selected={on}
        aria-disabled={full}
        onClick={() => toggle(family)}
        className={`flex h-8 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm outline-selection focus-visible:outline-2 ${
          on ? 'bg-selection-soft' : full ? 'cursor-default opacity-40' : 'hover:bg-hover'
        }`}
      >
        {/* 줄마다 그 글꼴로 이름을 적어서 후보로 넣기 전에 모양을 본다. 글꼴마다 위아래 여백이 달라 이름이 줄 안에서 위나 아래로 치우치므로, 여백을 잘라 내고 가운데에 놓는다. */}
        <span className={`min-w-0 flex-1 whitespace-nowrap ${TRIM}`} style={{ fontFamily: `"${family}", system-ui, sans-serif` }}>
          {family}
        </span>
        {on && <Check size={14} strokeWidth={1.5} className="shrink-0 text-ink-soft" />}
      </button>
    )
  }

  return (
    <form ref={form} onSubmit={submit} className="flex gap-6">
      <div className="flex w-56 shrink-0 flex-col">
        <input autoFocus aria-label="글꼴 찾기" className={inputClass} value={query} placeholder="찾기" onChange={(e) => setQuery(e.target.value)} />
        <div role="listbox" aria-label="글꼴 목록" aria-multiselectable className="mt-1.5 min-h-80 flex-1 basis-0 overflow-y-auto rounded-md border border-hairline p-1">
          {/* 목록에 없는 글꼴은 이름만 적어 넣지 못한다. 불러올 곳을 모르는 글꼴은 견본이 다른 글꼴로 그려져 견주는 뜻이 없기 때문이다. 그런 글꼴은 AI가 찾아서 넣는다. */}
          {groups.size === 0 && (
            <p className="px-2 py-4 text-sm leading-5 text-ink-faint">
              목록에 없는 글꼴이에요.
              <br />
              AI에게 추가해 달라고 하세요.
            </p>
          )}
          {[...groups].map(([group, list]) => (
            <div key={group}>
              <p className="px-2 pt-2 pb-1 text-xs font-[550] text-ink-faint">{group}</p>
              {/* 고른 줄과 마우스를 올린 줄의 바탕이 서로 닿지 않게 줄 사이를 4px 띄운다. */}
              <div className="space-y-1">{list.map((family) => row(family))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 창의 높이는 고정이다. 고른 글꼴이나 견본 크기에 따라 늘었다 줄었다 하지 않고, 넘치면 세 카드가 함께 스크롤된다.
            세 카드는 한 격자의 줄을 함께 쓴다(이름 한 줄과 견본의 줄들). 마지막 줄이 남는 높이를 차지한다. */}
        <div
          ref={grid}
          className="grid h-[710px] max-h-[calc(100vh-220px)] grid-cols-3 gap-x-2 overflow-x-hidden overflow-y-auto"
          style={{ gridTemplateRows: `repeat(${SAMPLE_ROWS}, auto) 1fr` }}
        >
          {Array.from({ length: SLOTS }, (_, i) => {
            // 후보를 고르기 전에는 세 자리 모두 비어 있다.
            const family = places[i]
            if (!family) return <div key={i} className="rounded-md border border-dashed border-hairline transition-transform duration-150" style={{ ...CARD_ROWS, transform: shift(i) }} />
            const on = family === marked
            return (
              // 카드를 좌우로 끌면 자리를 옮긴다. 끄는 카드는 손을 따라가며 위에 뜨고, 비켜나는 카드는 부드럽게 움직인다.
              <div
                key={family}
                data-card={i}
                onPointerDown={(e) => startDrag(e, i)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`relative rounded-md border bg-canvas ${SUBGRID} ${on ? 'border-selection' : 'border-hairline'} ${
                  drag?.from === i ? 'z-10 cursor-grabbing shadow-dialog' : 'transition-transform duration-150'
                }`}
                style={{ ...CARD_ROWS, transform: shift(i) }}
              >
                {/* 줄을 함께 쓰려면 격자여야 해서 button 대신 div로 만들고, 키보드로도 누를 수 있게 한다. */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${family}로 정하기`}
                  onClick={() => {
                    if (justDragged.current) return
                    // 정한 카드를 다시 누르면 풀린다.
                    setChosen(on ? null : family)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    setChosen(on ? null : family)
                  }}
                  className={`cursor-pointer overflow-hidden rounded-md text-left outline-selection focus-visible:outline-2 ${SUBGRID}`}
                  style={CARD_ROWS}
                >
                  {/* 높이를 정해 둔다. 글자를 줄이는 처리(truncate) 때문에 이 줄은 "줄어들어도 되는 줄"로 취급되어, 견본이 카드 영역보다 길어지면 높이가 0에 가깝게 눌린다. */}
                  <span className="block h-10 truncate px-3 pt-3 pr-9 pb-2 text-sm leading-5 font-[550] text-ink-faint">{family}</span>
                  {/* 견본은 카드의 아래쪽을 가장자리까지 채운다. 바탕색을 고르면 그 색이 카드에 깔린다. */}
                  <FontSample family={valueOf(family)} weights={weightsOf(family)} ink={ink} surface={surface} scale={scale} weight={weight} className="px-3 pt-2 pb-3" />
                </div>
                {/* 선택 선의 두 번째 1px. 견본의 바탕색이 카드를 가장자리까지 채우므로, 그 위에 덧그려야 가려지지 않는다. 카드 안쪽에 그어서 스크롤 영역의 가장자리에서도 잘리지 않는다. */}
                {on && <span className="pointer-events-none absolute inset-0 rounded-[5px] shadow-[inset_0_0_0_1px_var(--color-selection)]" />}
                <button
                  type="button"
                  aria-label={`${family} 빼기`}
                  onClick={() => toggle(family)}
                  className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-sm text-ink-faint outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            {/* 이름. 미리 채워져 있어서 그대로 두어도 되고, 바꾸고 싶을 때만 고친다. 바꾸는 창에서는 이름을 묻지 않는다. */}
            {!edit && (
              <div>
                <label className="flex items-center gap-2">
                  <span className={LABEL}>이름</span>
                  <input
                    aria-label="이름"
                    className={`${inputClass} w-40 ${nameError ? 'border-danger focus:border-danger' : ''}`}
                    value={nameDraft ?? autoName}
                    placeholder={autoName}
                    onChange={(e) => {
                      setNameDraft(e.target.value)
                      setNameError(null)
                    }}
                  />
                </label>
                {nameError && <span className="mt-1 block text-sm text-danger">{nameError}</span>}
              </div>
            )}
            {/* 견본을 보는 방식. 저장되는 값이 아니라, 내 색 위에서 어떻게 보이는지와 크게 봤을 때의 모양을 견주려는 것이다. */}
            {/* 내 의미 색으로 만든 글자+바탕 조합들. 한 번 누르면 둘이 함께 바뀐다. 색 선택 창을 두 번 여닫지 않고 여러 조합 위에서 글꼴을 본다. */}
            {(look.pairs?.length ?? 0) > 1 && (
              <span className="flex h-8 items-center gap-1">
                <span className={`${LABEL} mr-1`}>색</span>
                {look.pairs!.map((pair) => {
                  const on = pair.ink === ink && pair.surface === surface
                  return (
                    <button
                      key={pair.name}
                      type="button"
                      title={pair.name}
                      aria-label={`견본 색: ${pair.name}`}
                      aria-pressed={on}
                      onClick={() => {
                        setInk(pair.ink)
                        setSurface(pair.surface)
                      }}
                      className={`flex size-6 items-center justify-center rounded-sm border text-xs font-[650] outline-selection focus-visible:outline-2 ${
                        on ? 'border-selection shadow-[0_0_0_1px_var(--color-selection)]' : 'border-hairline hover:border-ink-faint'
                      }`}
                      style={{ background: pair.surface, color: pair.ink }}
                    >
                      가
                    </button>
                  )
                })}
              </span>
            )}
            <span className="flex h-8 items-center gap-2">
              <span className={LABEL}>글자</span>
              <ColorSwatch label="견본 글자색" value={ink} onChange={setInk} />
              <span className={`${LABEL} ml-2`}>바탕</span>
              <ColorSwatch label="견본 바탕색" value={surface} onChange={setSurface} />
            </span>
            <span className="flex h-8 items-center gap-1">
              <span className={`${LABEL} mr-1`}>크기</span>
              <button type="button" aria-label="견본 글자 작게" disabled={size <= SIZE_MIN} onClick={() => stepSize(-1)} className={SCALE_BUTTON}>
                <Minus size={16} strokeWidth={1.5} />
              </button>
              <span data-size className="w-11 text-center text-sm tabular-nums">{size}px</span>
              <button type="button" aria-label="견본 글자 크게" disabled={size >= SIZE_MAX} onClick={() => stepSize(1)} className={SCALE_BUTTON}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </span>
            {/* 읽는 글의 굵기. 100씩 바꾼다. 그 굵기가 없는 글꼴은 가장 가까운 굵기로 그려진다(브라우저가 그렇게 한다). */}
            <span className="flex h-8 items-center gap-1">
              <span className={`${LABEL} mr-1`}>굵기</span>
              <button type="button" aria-label="견본 글자 얇게" disabled={weight <= 100} onClick={() => stepWeight(-1)} className={SCALE_BUTTON}>
                <Minus size={16} strokeWidth={1.5} />
              </button>
              <span data-weight-now className="w-9 text-center text-sm tabular-nums">{weight}</span>
              <button type="button" aria-label="견본 글자 굵게" disabled={weight >= 900} onClick={() => stepWeight(1)} className={SCALE_BUTTON}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </span>
          </div>
          <div className="flex items-center gap-2">
          {/* 알림은 누르려던 버튼 바로 왼쪽에 둔다. 눈이 가 있는 자리라 놓치지 않는다. */}
          {error && <span role="alert" className="mr-1 text-sm whitespace-nowrap text-danger">{error}</span>}
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="submit">
            {edit ? '바꾸기' : '추가'}
          </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
