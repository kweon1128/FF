import { createContext, useContext, useEffect, useRef, useState, type FormEvent } from 'react'
import { SLUG } from './lib/catalog'
import { Check, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { CATALOG, FALLBACKS, commonFonts, fontValue, loadCatalog, loadFont, nameForFont, parseFontValue, inkShift, recordFont, systemFamilies, typeOfFont, weightsOf } from './lib/fonts'
import { useUndo } from './lib/useUndo'
import { Button, inputClass } from './ui'

/** 한 묶음에서 한 번에 그리는 글꼴의 수. 줄마다 그 글꼴로 그리므로 너무 많으면 느려진다. 더 찾으려면 이름을 적어 좁힌다. */
const MAX_ROWS = 80
/** 나란히 견주는 후보의 수. */
const SLOTS = 3
const LOCAL = '내 컴퓨터'
const SYSTEM = '이 시스템의 글꼴'
/** 창을 열었을 때의 본문 글자 크기(px). 모양의 차이가 잘 보이도록 실제 본문보다 조금 크게 시작한다. */
const SIZE_START = 16
/** 견본의 본문 글자 크기를 바꿔 볼 수 있는 범위(px). 본문으로 실제 쓰이는 크기다. 12px 아래는 보조 글자, 20px 위는 제목의 영역이다. */
const SIZE_MIN = 12
const SIZE_MAX = 20
/** 굵기 줄의 자리들. 글꼴에 없는 굵기도 자리는 비워 둔 채 남겨서, 나란히 놓은 견본끼리 같은 굵기가 같은 높이에 오게 한다. */
const WEIGHT_SLOTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]
/** 견본의 줄 수: 머리말, 제목, 금액과 상태, 본문, 더 보기, 이름표, 입력칸과 버튼, 주문 번호, 버튼 줄, 굵기 한 줄. */
const SAMPLE_ROWS = 10
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
const BOXED = ['배송 준비', '바꾸기', '더 보기', '결제 완료', '출고 완료', '김하늘']
/** 설정의 이름표. 값 위에 둔다. 한 벌 만들기 창들의 왼쪽 열과 같다. */
const LABEL = 'mb-1 text-sm font-[550] text-ink-faint'
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

/** 글자 크기가 아직 하나도 없는 시스템에서 쓰는 크기들. 본문 16px, 단계 사이 보통으로 만든 한 벌이다. */
const FALLBACK_SIZES = [
  { size: '12px', line: '16px' },
  { size: '14px', line: '20px' },
  { size: '16px', line: '24px' },
  { size: '19px', line: '28px' },
  { size: '23px', line: '32px' },
  { size: '28px', line: '36px' },
  { size: '33px', line: '42px' },
]

const pxOf = (size: string) => parseFloat(size) * (size.trim().endsWith('rem') ? 16 : 1)

/**
 * 견본의 자리마다 쓰는 글자 크기. 이 시스템의 크기 가운데 16px에 가장 가까운 것을 본문으로 보고, 거기서 몇 단계 떨어졌는지로 고른다.
 * 의미 글꼴 한 벌 만들기와 같은 짝이다: 보조 설명은 두 단계 아래(xs), 버튼과 이름표는 한 단계 아래(sm), 본문과 입력칸은 본문(base),
 * 금액은 한 단계 위(lg), 상품 이름은 세 단계 위(2xl). 그만큼 떨어진 크기가 없으면 끝의 것을 쓴다.
 */
function sampleSizes(look: SampleLook) {
  const sizes = look.sizes.length > 0 ? look.sizes : FALLBACK_SIZES
  const base = sizes.reduce((best, s, i) => (Math.abs(pxOf(s.size) - 16) < Math.abs(pxOf(sizes[best].size) - 16) ? i : best), 0)
  const at = (step: number) => sizes[Math.min(sizes.length - 1, Math.max(0, base + step))]
  return { small: at(-2), sm: at(-1), body: at(0), sub: at(1), title: at(3) }
}

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

/** 견본의 본문 글자 크기(px). 이 시스템의 글자 크기 가운데 16px에 가장 가까운 것이다. */
export function bodySize(look: SampleLook) {
  return pxOf(sampleSizes(look).body.size) || 16
}

/**
 * 견본에 쓰는 굵기. 굵기 한 벌 만들기의 3단계와 같다: 읽는 글은 창에서 고른 굵기, 버튼과 이름표와 상태 표시는 500, 제목과 금액은 600.
 * 700은 쓰지 않는다. 화면에서 무겁고 획이 많은 한글은 뭉쳐 보이기 쉽다.
 */
const W_CONTROL = 500
const W_HEADING = 600

/**
 * 글꼴이 쓰인 모습. 글꼴은 문장 한 줄로는 차이가 보이지 않아서, 실제 화면에서 만나는 자리들에 놓아 보여 준다.
 * 부품을 따로따로 늘어놓지 않고 주문 한 건을 보는 화면 하나로 잇는다. 한 벌 만들기 창들의 화면 예시(주문 관리)와 같은 가게의 화면이다.
 * 위에서부터 머리말, 상품 이름, 금액과 상태, 안내 문단과 더 보기, 받는 분(이름표, 입력칸과 그 옆의 버튼), 주문 번호, 버튼 줄이 한 화면이다.
 * 버튼과 입력칸은 종류별로 줄 세워 늘어놓지 않고 화면에서 실제로 놓이는 자리에 둔다(상태 표시는 금액 옆, 더 보기는 문단 아래, 바꾸기는 입력칸 옆, 주요 버튼은 맨 아래).
 * 카드의 맨 아래에는 화면이 아니라 이 글꼴에 대한 것 하나(들어 있는 굵기들)가 따로 있다.
 * 문단 말고는 줄이 바뀌지 않게 짧은 글을 쓴다. 줄이 바뀌면 글꼴마다 줄 수가 달라져 같은 자리끼리 견줄 수 없다.
 *
 * 글자 크기와 줄 높이는 이 디자인 시스템의 글자 크기 값을 따르고, 자리마다 어느 크기를 쓸지는 한 벌 만들기 창들과 같은 짝이다(sampleSizes).
 * 굵기, 상자의 높이와 좌우 여백, 글과 글 사이의 여백도 한 벌 만들기 창들의 규칙을 따른다. 견본끼리 규칙이 다르면 같은 값이 창마다 다르게 보인다.
 * 색은 이 시스템의 기본 글자색과 바탕색이고, ink와 surface를 주면 그 색으로 그린다.
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
  const picked = sampleSizes(look)
  const type = (step: { size: string; line: string }) => ({ fontSize: step.size, lineHeight: step.line })
  const small = type(picked.small)
  const sm = type(picked.sm)
  const body = type(picked.body)
  const sub = type(picked.sub)
  const title = type(picked.title)
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
    Promise.all([W_CONTROL, W_HEADING, weight].map((w) => document.fonts.load(`${w} 16px ${family}`, BOXED.join('') + 'H')))
      .then(() => alive && setLoaded((n) => n + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [family, weight])
  /** 상자 안의 글을 그 글자의 실제 모양 기준으로 한가운데에 놓는다. 대문자 기준으로 잡힌 자리에서, 모양이 치우친 만큼 되돌린다. */
  const centered = (label: string, w: number) => ({ translate: `0 ${inkShift(family, w, label).toFixed(4)}em` })
  /**
   * 상자(버튼, 입력칸, 상태 표시)의 치수. 글자 크기 한 벌 만들기의 예시 상자와 같은 규칙이다.
   * 높이는 그 크기의 줄 높이에 위아래 여백(pad)을 더한 것이고, 좌우 여백은 높이의 0.4배를 짝수 px로 맞춘 것이다(입력칸은 0.34배).
   */
  const box = (step: { size: string; line: string }, pad: number, side = 0.4) => {
    const height = (parseFloat(step.line) || Math.round(pxOf(step.size) * 1.5)) + pad * 2
    return { fontSize: step.size, height, paddingInline: Math.round((height * side) / 2) * 2 }
  }
  return (
    // 견본의 줄 하나하나가 격자의 한 줄이다. 나란히 놓은 카드들이 같은 격자의 줄을 함께 쓰면(subgrid), 글꼴마다 줄이 차지하는
    // 높이가 조금씩 달라도 같은 줄이 정확히 같은 높이에 온다. 혼자 그려질 때(패널)는 그냥 위에서부터 쌓인다.
    // 글과 글 사이의 여백은 견본 화면의 규칙을 따른다: 이름표와 그것이 가리키는 글은 0, 바로 이어지는 글은 4px, 덩어리 사이는 16px.
    <div className={`${SUBGRID} ${className}`} style={{ gridRow: `span ${SAMPLE_ROWS}`, fontFamily: family, color: text, background: back, zoom: scale }}>
      {/* 한 줄짜리 글은 높이를 줄 높이 그대로 고정한다(1lh). 글꼴마다 글자가 차지하는 높이가 달라 줄 상자가 1~2px씩 커지는데, 그대로 두면 글꼴을 바꿀 때마다 아래 줄들이 밀린다. */}
      {/* 머리말. 제목 위의 작은 글자다. 이름표와 그것이 가리키는 글 사이라 띄우지 않는다. */}
      <p className={`${LINE} opacity-70`} style={{ ...small, ...read }}>
        최근 주문 · 2분 전
      </p>
      <p className={LINE} style={{ ...title, fontWeight: W_HEADING }}>
        한라봉 선물세트
      </p>
      {/* 금액과, 그 줄의 오른쪽 끝에 상태 표시. 상태 표시는 연한 배경 버튼의 모양이다(글자색을 옅게 깐 바탕). */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className={LINE} style={{ ...sub, fontWeight: W_HEADING }}>
          38,000원 · 2상자
        </p>
        <span data-controls className="inline-flex shrink-0 items-center rounded-md" style={{ ...box(picked.small, 4), fontWeight: W_CONTROL, background: `color-mix(in srgb, ${text} 10%, transparent)` }}>
          <span className={TRIM} style={centered('결제 완료', W_CONTROL)}>
            결제 완료
          </span>
        </span>
      </div>
      {/* 문단의 높이는 정해 두지 않는다. 나란히 놓인 카드들은 격자의 줄을 함께 쓰므로, 글꼴마다 줄 수가 달라도 이 줄은 가장 긴 카드에 맞춰지고 아래 줄들은 같은 높이에 온다. */}
      {/* 문단도 첫 줄의 글자 높이를 다른 글꼴과 맞춘다. 첫 줄의 위 여백을 잘라 내고, 줄 높이와 대문자 높이의 차이의 절반만큼 다시 띄운다. */}
      <p className="mt-1 box-border pt-[calc((1lh-1cap)/2)] [text-box:trim-start_cap_alphabetic]" style={{ ...body, ...read }}>
        {/* 영문은 한글 두 문장을 그대로 옮긴 것이다. 한쪽만 옮기면 읽다가 말이 끊긴다. */}
        오후 2시 전에 준비를 마치면 당일에 출고됩니다. 수도권은 내일, 그 밖의 지역은 모레 도착합니다. Ships today if packed by 2 PM. Arrives tomorrow in the Seoul area, in two days elsewhere.
      </p>
      {/* 문단 아래의 투명 버튼(글자만). 왼쪽 여백 없이 문단의 글줄에 맞춘다. */}
      <div data-controls className="flex">
        <span className="inline-flex shrink-0 items-center" style={{ ...box(picked.sm, 8, 0), fontWeight: W_CONTROL }}>
          <span className={TRIM} style={centered('더 보기', W_CONTROL)}>
            더 보기
          </span>
        </span>
      </div>
      {/* 받는 분: 이름표, 그리고 입력칸과 그 옆의 보조 버튼(테두리만). 입력칸이 줄을 혼자 다 차지하지 않고 버튼과 한 줄을 이룬다.
          입력칸 안의 글자는 본문 크기라, 옆의 버튼도 높이가 같도록 본문 크기의 버튼(큰 버튼)을 쓴다. */}
      <p className={`mt-4 ${LINE} opacity-70`} style={{ ...sm, fontWeight: W_CONTROL }}>
        받는 분
      </p>
      <div data-input className="mt-1 flex gap-2">
        <span className="flex min-w-0 flex-1 items-center rounded-md" style={{ ...box(picked.body, 8, 0.34), ...read, border: `1px solid color-mix(in srgb, ${text} 20%, transparent)` }}>
          <span className={TRIM} style={centered('김하늘', weight)}>
            김하늘
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center rounded-md" style={{ ...box(picked.body, 8), fontWeight: W_CONTROL, border: `1px solid color-mix(in srgb, ${text} 25%, transparent)` }}>
          <span className={TRIM} style={centered('바꾸기', W_CONTROL)}>
            바꾸기
          </span>
        </span>
      </div>
      {/* 주문 번호와 날짜. 숫자와 기호가 섞인 줄이다. */}
      <p className={`mt-4 ${LINE} opacity-70`} style={{ ...small, ...read }}>
        ORD-0412-0087 · 2026.04.12 09:41
      </p>
      {/* 화면의 맨 아래: 주요 버튼(글자색을 바탕으로, 바탕색을 글자로 뒤집음)이 남는 폭을 차지하고, 그 옆에 비활성 버튼(주요 버튼을 흐리게)이 있다. */}
      <div data-controls className="mt-4 flex gap-2">
        <span className="inline-flex min-w-0 flex-1 items-center justify-center rounded-md" style={{ ...box(picked.sm, 8), fontWeight: W_CONTROL, background: text, color: back }}>
          <span className={TRIM} style={centered('배송 준비', W_CONTROL)}>
            배송 준비
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center rounded-md opacity-40" style={{ ...box(picked.sm, 8), fontWeight: W_CONTROL, background: text, color: back }}>
          <span className={TRIM} style={centered('출고 완료', W_CONTROL)}>
            출고 완료
          </span>
        </span>
      </div>
      {/* 여기는 화면이 아니라 이 글꼴에 대한 것이다. 카드의 맨 아래에 붙이고 옅은 선으로 나눈다(견본의 마지막 줄이 카드의 남는 높이를 차지하고, 이 줄은 그 아래 끝에 놓인다).
          이 글꼴에 굵기가 몇 단계 있는지. 100부터 900까지 아홉 칸이 한 줄이고, 칸마다 그 굵기로 쓴 글자와 숫자가 있다.
          없는 굵기는 숫자만 아주 옅게 남긴다. 지금 읽는 글이 실제로 그려지고 있는 굵기의 칸을 밑줄로 표시한다(청한 굵기가 없으면 대신 그려지는 굵기). */}
      <div data-weights className="mt-4 grid grid-cols-9 self-end pt-4" style={{ borderTop: `1px solid color-mix(in srgb, ${text} 12%, transparent)` }}>
        {WEIGHT_SLOTS.map((w) => {
          const has = weights.includes(w)
          return (
            <span key={w} data-weight={w} data-has={has} data-on={w === drawn} className="text-center">
              <span className="block h-[1lh] content-center whitespace-nowrap [text-box:trim-both_cap_alphabetic]" style={{ ...body, fontWeight: w }}>
                {has ? '가' : '\u00a0'}
              </span>
              <span
                className={`mx-auto block w-fit border-b font-mono text-[10px] leading-[14px] ${has ? 'opacity-60' : 'opacity-20'}`}
                style={{ borderColor: w === drawn ? 'currentColor' : 'transparent' }}
              >
                {w}
              </span>
            </span>
          )
        })}
      </div>
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
  // 후보로 고른 글꼴은 모든 굵기로 불러온다. 견본에서 굵기를 바꿔 가며 보기 때문이다. 목록의 나머지 글꼴은 보통 굵기만 불러와 있다.
  const wanted = cands.join('|')
  useEffect(() => {
    for (const family of wanted.split('|')) loadFont(family)
  }, [wanted])
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
  // 견본을 보는 방식: 크기와 굵기. 창을 닫으면 처음으로 돌아간다. 색은 고르지 않고 늘 이 시스템의 기본 글자색과 바탕색으로 그린다.
  // 글꼴을 고르는 데 필요한 것은 크기와 굵기에 따른 모양이고, 색까지 바꿔 보게 하면 설정이 창의 주인공이 된다.
  const look = useContext(SampleContext)
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

  // 창 안에서 고르고 고친 것(후보, 정한 글꼴, 이름, 견본을 보는 방식)을 Ctrl+Z로 되돌리고 Ctrl+Shift+Z로 다시 실행한다.
  useUndo({ places, chosen, nameDraft, weight, size }, (s) => {
    setPlaces(s.places)
    setChosen(s.chosen)
    setNameDraft(s.nameDraft)
    setNameError(null)
    setError(null)
    setWeight(s.weight)
    setSize(s.size)
  })

  // 처음 열었을 때의 후보 자리와 정한 글꼴. 바꾸는 창에서는 지금 글꼴이 첫 자리에 정해진 채로 시작한다.
  const firstPlaces = Array.from({ length: SLOTS }, (_, i) => (i === 0 && start?.font ? start.font : null))
  const firstChosen = start?.font || null
  // 처음과 달라진 것이 있는지. 후보, 정한 글꼴, 이름, 그리고 견본을 보는 방식(색, 크기, 굵기)을 모두 본다.
  const changed =
    places.some((f, i) => f !== firstPlaces[i]) ||
    chosen !== firstChosen ||
    nameDraft !== null ||
    weight !== 400 ||
    size !== SIZE_START
  /** 후보와 정한 글꼴, 이름, 견본을 보는 방식을 모두 처음으로 돌린다. 다른 한 벌 만들기 창의 "원래대로"와 같다. */
  function reset() {
    setPlaces(firstPlaces)
    setChosen(firstChosen)
    setNameDraft(null)
    setNameError(null)
    setError(null)
    setWeight(400)
    setSize(SIZE_START)
  }

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
    // 창의 높이는 화면에 맞춰 고정되어 있다(Modal의 tall). 이 양식이 그 높이를 채우고, 목록과 카드가 남는 높이를 차지한다.
    // 아래의 버튼 줄은 두 열 아래에 창의 폭을 다 써서 놓인다. 한 벌 만들기 창들처럼 "원래대로"가 창의 왼쪽 끝에 온다.
    <form ref={form} onSubmit={submit} className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 gap-6">
      <div className="flex min-h-0 w-56 shrink-0 flex-col">
        {/* 이 창의 주된 일은 글꼴을 고르는 것이라 찾기와 목록이 맨 위에 온다. */}
        <div className="flex min-h-0 flex-1 flex-col">
        <input autoFocus data-native-undo aria-label="글꼴 찾기" className={inputClass} value={query} placeholder="찾기" onChange={(e) => setQuery(e.target.value)} />
        <div role="listbox" aria-label="글꼴 목록" aria-multiselectable className="mt-2 min-h-80 flex-1 basis-0 overflow-y-auto rounded-md border border-hairline p-1">
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
        {/* 구분선 아래는 곁들이는 설정이다. 이름표는 값 위에 있고, 설정 사이는 16px이다.
            이름은 만들어지는 값이고, 크기와 굵기는 견본을 보는 방식이다(저장되지 않는다). */}
        <div className="mt-4 shrink-0 space-y-4 border-t border-hairline pt-4">
          {/* 이름. 미리 채워져 있어서 그대로 두어도 되고, 바꾸고 싶을 때만 고친다. 바꾸는 창에서는 이름을 묻지 않는다. */}
          {!edit && (
            <div>
              <p className={LABEL}>이름</p>
              {/* 혼자 놓이는 입력칸이라 패널의 입력칸과 같은 모양이다(높이 32px, 열의 폭을 다 씀, 14px). 표의 줄 안에 끼워 넣는 작은 고정폭 칸(24px)은 여기에 쓰지 않는다.
                  비어 있으면 붙여 줄 이름이 옅게 보이고, 틀린 이름이면 테두리가 빨개진다. */}
              <input
                aria-label="이름"
                spellCheck={false}
                className={`${inputClass} ${nameError ? 'border-danger focus:border-danger' : ''}`}
                value={nameDraft ?? autoName}
                placeholder={autoName}
                onChange={(e) => {
                  setNameDraft(e.target.value.trim())
                  setNameError(null)
                }}
              />
              {nameError && <span className="mt-1 block text-sm text-danger">{nameError}</span>}
            </div>
          )}
          <div>
            <p className={LABEL}>견본 크기</p>
            <span className="flex h-8 items-center gap-1">
              <button type="button" aria-label="견본 글자 작게" disabled={size <= SIZE_MIN} onClick={() => stepSize(-1)} className={SCALE_BUTTON}>
                <Minus size={16} strokeWidth={1.5} />
              </button>
              <span data-size className="w-20 text-center text-sm tabular-nums">
                {size}px
              </span>
              <button type="button" aria-label="견본 글자 크게" disabled={size >= SIZE_MAX} onClick={() => stepSize(1)} className={SCALE_BUTTON}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </span>
          </div>
          {/* 읽는 글의 굵기. 100씩 바꾼다. 그 굵기가 없는 글꼴은 가장 가까운 굵기로 그려진다(브라우저가 그렇게 한다). */}
          <div>
            <p className={LABEL}>견본 굵기</p>
            <span className="flex h-8 items-center gap-1">
              <button type="button" aria-label="견본 글자 얇게" disabled={weight <= 100} onClick={() => stepWeight(-1)} className={SCALE_BUTTON}>
                <Minus size={16} strokeWidth={1.5} />
              </button>
              <span data-weight-now className="w-20 text-center text-sm tabular-nums">
                {weight}
              </span>
              <button type="button" aria-label="견본 글자 굵게" disabled={weight >= 900} onClick={() => stepWeight(1)} className={SCALE_BUTTON}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 창의 높이는 고정이다. 고른 글꼴이나 견본 크기에 따라 늘었다 줄었다 하지 않고, 넘치면 세 카드가 함께 스크롤된다.
            세 카드는 한 격자의 줄을 함께 쓴다(이름 한 줄과 견본의 줄들). 마지막 줄이 남는 높이를 차지한다. */}
        <div
          className="grid min-h-0 flex-1 grid-cols-3 gap-x-2 overflow-x-hidden overflow-y-auto"
          style={{ gridTemplateRows: `repeat(${SAMPLE_ROWS}, auto) 1fr` }}
        >
          {Array.from({ length: SLOTS }, (_, i) => {
            // 후보를 고르기 전에는 세 자리 모두 비어 있다.
            const family = places[i]
            if (!family) return <div key={i} className="rounded-md border border-dashed border-hairline" style={CARD_ROWS} />
            const on = family === marked
            return (
              // 카드는 자리를 옮기지 않는다. 후보가 셋뿐이라 어느 자리에 있든 한눈에 견줄 수 있고, 카드의 순서는 만들어지는 값에 들어가지 않는다.
              // 끌어 옮기기를 두면 카드를 눌러 정하는 것과 조작이 겹친다.
              <div key={family} data-card={i} className={`relative rounded-md border bg-canvas ${SUBGRID} ${on ? 'border-selection' : 'border-hairline'}`} style={CARD_ROWS}>
                {/* 줄을 함께 쓰려면 격자여야 해서 button 대신 div로 만들고, 키보드로도 누를 수 있게 한다. */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${family}로 정하기`}
                  onClick={() => {
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
                  <span className="block h-10 truncate pt-3 pr-9 pb-2 pl-4 text-sm leading-5 font-[550] text-ink-faint">{family}</span>
                  {/* 견본은 카드의 아래쪽을 가장자리까지 채운다. 바탕색을 고르면 그 색이 카드에 깔린다. 안쪽 여백은 좌우 16px, 아래 12px로, 한 벌 만들기 창의 표 상자와 같다. */}
                  <FontSample family={valueOf(family)} weights={weightsOf(family)} scale={scale} weight={weight} className="px-4 pt-2 pb-3" />
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
      </div>
      </div>
        <div className="mt-3 flex shrink-0 items-center justify-end gap-2">
          {/* 바꾼 것을 모두 처음으로 돌린다. 한 벌 만들기 창들과 같은 자리다. 바꾼 것이 없으면 꺼져 있다. */}
          <Button variant="ghost" className="mr-auto" disabled={!changed} title="후보와 이름, 견본을 보는 방식을 모두 처음으로 돌려요" onClick={reset}>
            <RotateCcw size={16} strokeWidth={1.5} />
            원래대로
          </Button>
          {/* 알림은 누르려던 버튼 바로 왼쪽에 둔다. 눈이 가 있는 자리라 놓치지 않는다. */}
          {error && (
            <span role="alert" className="mr-1 text-sm whitespace-nowrap text-danger">
              {error}
            </span>
          )}
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="submit">
            {edit ? '바꾸기' : '추가'}
          </Button>
        </div>
    </form>
  )
}
