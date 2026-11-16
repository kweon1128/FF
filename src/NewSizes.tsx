import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check as CheckIcon, Minus, Plus, RotateCcw } from 'lucide-react'
import { PreviewFontContext } from './ColorUses'
import { shownFont } from './lib/fonts'
import { BASE_MAX, BASE_MIN, SPREAD_START, SPREAD_STEPS, UPS_MAX, UPS_MIN, UPS_START, baseLineRange, lineFor, sizeScale, trackFor, type SizeStep } from './lib/presets'
import { StepName, nameProblem } from './StepName'
import { Button, UnitInput } from './ui'

/** 위아래 여백을 잴 때 기준으로 삼는 글자. 받침이 없는 글자와 있는 글자가 섞여 한글의 평균적인 높이를 낸다. */
const INK = '가나다라마바사'
/**
 * 글자가 가운데에서 이만큼(px) 넘게 밀려 있으면 눈에 띄게 치우친 것으로 보고 색으로 알린다.
 * 브라우저는 기준선을 화면 픽셀에 맞추느라 글자를 가운데에서 1px 안쪽으로 밀어 놓는다(대개 위로). 화면 배율에 따라 달라지고 어느 사이트에서나 생기는 일이라, 그 안쪽은 알리지 않는다.
 */
const OFF = 1
/** 견본에서 그 단계를 그리는 굵기. 본문보다 큰 단계는 제목이라 굵게 쓴다. */
const weightOf = (name: string) => (name === 'base' || name === 'sm' || name === 'xs' ? 400 : 700)

/** 글자가 가운데에서 밀린 양(px). 양수면 위로, 음수면 아래로 밀린 것이다. 위아래 여백의 차이의 절반이다. */
const shiftOf = (gap: { top: number; bottom: number }) => (gap.bottom - gap.top) / 2

const LABEL = 'mb-1 text-sm font-[550] text-ink-faint'
const STEP_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent'

/** 예시 상자에 쓰는 세 크기. 작은 것부터. 상자에 들어가는 글자는 본문 크기 이하다. */
const EXAMPLE_SIZES = ['xs', 'sm', 'base'] as const
type ExampleSize = (typeof EXAMPLE_SIZES)[number]

/**
 * 크기가 실제로 들어가는 상자들의 예시. 한 열이 한 종류이고, 줄은 크기다(크기 × 종류의 표). 같은 종류를 위아래로 놓아야 크기에 따라 어떻게 달라지는지 한눈에 견준다.
 * 그 종류가 쓰지 않는 크기의 칸은 비워 둔다(입력칸에 xs는 없고, 뱃지는 xs뿐이다).
 * pad는 줄 높이 위아래에 더하는 여백(px), box는 상자의 모양이다.
 * 좌우 여백은 px로 고정하지 않고 상자 높이에 대한 비율(side)로 정한다. 줄 높이를 넓혀 상자가 높아지면 좌우도 함께 넓어져야 모양이 유지된다. 높이만 커지면 상자가 세로로 길쭉해진다.
 * 모두 높이가 정해진 상자 안에 글이 놓이는 것들이라 위아래 가운데가 중요하다.
 */
const EXAMPLE_ROWS: { id: string; /** 좌우 여백이 상자 높이의 몇 배인지. */ side: number; label: string; weight: number; text: string; icon?: boolean; cells: Partial<Record<ExampleSize, { pad: number; box: string }>> }[] = [
  {
    id: 'button',
    side: 0.4,
    label: '버튼',
    weight: 600,
    text: '저장하기',
    cells: {
      xs: { pad: 4, box: 'rounded-md bg-ink text-white' },
      sm: { pad: 8, box: 'rounded-md bg-ink text-white' },
      base: { pad: 8, box: 'rounded-md bg-ink text-white' },
    },
  },
  {
    id: 'icon',
    side: 0.4,
    label: '아이콘 버튼',
    weight: 600,
    text: '완료',
    icon: true,
    cells: {
      xs: { pad: 4, box: 'rounded-md border border-hairline' },
      sm: { pad: 8, box: 'rounded-md border border-hairline' },
      base: { pad: 8, box: 'rounded-md border border-hairline' },
    },
  },
  {
    id: 'input',
    side: 0.34,
    label: '입력칸',
    weight: 400,
    text: '이메일 주소',
    cells: {
      sm: { pad: 8, box: 'min-w-28 rounded-md border border-hairline whitespace-nowrap text-ink-faint' },
      base: { pad: 8, box: 'min-w-28 rounded-md border border-hairline whitespace-nowrap text-ink-faint' },
    },
  },
  {
    id: 'chip',
    side: 0.4,
    label: '칩',
    weight: 500,
    text: '디자인',
    cells: {
      xs: { pad: 4, box: 'rounded-full bg-hover' },
      sm: { pad: 4, box: 'rounded-full bg-hover' },
    },
  },
  {
    id: 'badge',
    side: 0.25,
    label: '뱃지',
    weight: 700,
    text: '필수',
    cells: { xs: { pad: 0, box: 'rounded-sm bg-selection text-white' } },
  },
]

/** 그 크기의 줄 높이가 가장 커질 때의 값(px). 본문을 가장 크게, 본문의 줄 높이를 가장 넓게 골랐을 때다(xs, sm, base의 크기는 단계 사이와 관계없다). */
const MAX_LINE = (() => {
  const range = baseLineRange(BASE_MAX)
  const steps = sizeScale(BASE_MAX, SPREAD_START, range.max / range.normal, true)
  return Object.fromEntries(EXAMPLE_SIZES.map((name) => [name, parseFloat(steps.find((s) => s.name === name)!.line)])) as Record<ExampleSize, number>
})()
/** 한 줄(한 크기)의 상자들이 놓이는 자리의 높이(px). 그 줄에서 가장 커질 수 있는 상자의 높이로 고정해서, 고르는 동안 줄의 높이가 바뀌지 않는다. */
const slotOf = (size: ExampleSize) => Math.max(...EXAMPLE_ROWS.map((kind) => (kind.cells[size] ? MAX_LINE[size] + kind.cells[size]!.pad * 2 : 0)))

/**
 * 단계마다 그 크기가 흔히 쓰이는 곳(use)과, 그 자리에 실제로 놓일 법한 글(text).
 * 쓰이는 곳은 의미 글꼴 한 벌 만들기가 그 크기에 짝짓는 쓰임새와 같다(lib/types.ts의 SET). 두 창이 같은 크기를 다르게 부르면 안 된다.
 * 3xl은 display, 2xl은 title-lg, xl은 title-md, lg는 title-sm과 body-lg, base는 body와 button-lg, sm은 button과 label과 body-sm, xs는 caption과 button-sm.
 * 글은 의미 글꼴 창의 화면 예시(주문 관리)에 나오는 것들이라, 위에서 아래로 읽으면 한 화면의 위계가 된다.
 */
const SAMPLES: Record<string, { use: string; text: string }> = {
  // 3xl부터는 모두 크게 내세우는 숫자나 문구다. 단계가 클수록 견본을 짧게 해서 줄에 들어가게 한다.
  '5xl': { use: '큰 숫자·문구', text: '318건' },
  '4xl': { use: '큰 숫자·문구', text: '1.2일' },
  '3xl': { use: '큰 숫자·문구', text: '1,248만 원' },
  '2xl': { use: '화면 제목', text: '주문 관리' },
  xl: { use: '구역 제목', text: '최근 주문' },
  lg: { use: '카드·창 제목, 소개 글', text: '한라봉 선물세트' },
  base: { use: '본문, 큰 버튼', text: '오늘 들어온 주문은 18건입니다' },
  sm: { use: '버튼, 이름표, 작은 본문', text: '배송 준비 · 받는 분 · 문 앞에 놓아 주세요' },
  xs: { use: '보조 설명, 작은 버튼', text: '2분 전 · 택배 기사님이 보는 이름이에요' },
}

/**
 * 한 벌이 한 화면에 놓인 모습. 여기서 볼 것은 글자 크기뿐이라 버튼이나 카드 없이 글만 위계대로 놓는다.
 * 화면은 단계 수마다 다르다. 단계가 적은 한 벌과 많은 한 벌은 쓰이는 곳이 달라서, 같은 글에 줄만 더하고 빼는 것이 아니라 그 단계 수가 가장 어울리는 화면을 보여 준다.
 *   5단계(xl까지): 설정 화면. 정보가 빽빽한 도구는 제목이 크지 않고 구역 제목과 본문이 되풀이된다.
 *   6단계(2xl까지): 주문 상세. 화면 제목, 구역 제목, 카드 제목의 세 층이 있는 흔한 앱 화면이다.
 *   7단계(3xl까지): 공지 글. 제목과 본문 사이에 내세우는 숫자가 하나 있다.
 *   8단계(4xl까지): 요약 화면. 큰 숫자가 둘이고 크기로 무엇이 더 중요한지 나눈다.
 *   9단계(5xl까지): 소개 페이지. 맨 위에 가장 크게 내세우는 문구가 있고 그 아래로 숫자와 설명이 이어진다.
 * 어느 화면이든 그 한 벌의 모든 단계가 한 번 이상 나온다. ups는 본문보다 큰 단계의 수(2~6)다.
 * 단계의 자리는 의미 글꼴 한 벌의 짝과 같다. 어느 줄이 어느 단계인지는 적어 두지 않고, 마우스를 올리면 표의 줄과 서로 표시된다.
 * top은 그 줄 위의 여백이다. 의미 글꼴 창의 화면 예시(TypeScreen)와 같은 규칙으로 넣는다: 이름표와 그것이 가리키는 글은 0, 제목이나 글과 바로 이어지는 글은 4px(mt-1), 같은 묶음 안의 덩어리 사이는 16px(mt-4), 묶음과 묶음 사이는 24px(mt-6).
 */
type PageRow = { step: string; weight: number; soft?: boolean; top?: string; text: string }
function pageRows(ups: number): PageRow[] {
  const soft = (step: string, text: string, top?: string): PageRow => ({ step, weight: 400, soft: true, top, text })
  const strong = (step: string, text: string, top?: string): PageRow => ({ step, weight: 700, top, text })
  const body = (text: string, top?: string): PageRow => ({ step: 'base', weight: 400, top, text })
  // 5단계: 설정 화면.
  if (ups <= 2)
    return [
      soft('xs', '설정 › 알림'),
      strong('xl', '알림 설정'),
      body('어떤 일이 있을 때 알림을 받을지 정합니다. 바꾼 내용은 바로 적용됩니다.', 'mt-1'),
      strong('lg', '이메일', 'mt-6'),
      body('새 주문이 들어오면 바로 알려 드립니다. 주문이 많은 날에는 한 시간마다 모아서 보냅니다.', 'mt-1'),
      soft('sm', '받는 주소는 계정 설정에서 바꿀 수 있습니다.', 'mt-1'),
      strong('lg', '문자', 'mt-4'),
      body('배송이 하루 넘게 늦어질 때만 보냅니다.', 'mt-1'),
      soft('sm', '밤 9시부터 아침 8시까지는 보내지 않습니다.', 'mt-1'),
      soft('xs', '마지막으로 바꾼 날 · 2025년 4월 12일', 'mt-6'),
    ]
  // 6단계: 주문 상세.
  if (ups === 3)
    return [
      soft('xs', '주문 › ORD-0412-0087'),
      strong('2xl', '주문 상세'),
      soft('lg', '4월 12일 오전에 들어온 주문입니다.', 'mt-1'),
      strong('xl', '배송 정보', 'mt-6'),
      body('서울 마포구 월드컵북로 21, 3층. 받는 분은 김하늘 님이고 오늘 오후에 출고합니다.', 'mt-1'),
      soft('sm', '문 앞에 놓아 주세요.', 'mt-1'),
      strong('xl', '주문한 상품', 'mt-6'),
      strong('lg', '한라봉 선물세트', 'mt-1'),
      body('3kg 상자 둘, 모두 38,000원입니다.', 'mt-1'),
      soft('sm', '선물 포장을 함께 신청했습니다.', 'mt-1'),
      soft('xs', '2분 전에 바뀜', 'mt-6'),
    ]
  // 7단계: 공지 글.
  if (ups === 4)
    return [
      soft('xs', '공지 · 2025년 4월 12일'),
      strong('2xl', '배송이 더 빨라집니다'),
      soft('lg', '오후 2시 전에 주문하면 그날 바로 보내 드립니다.', 'mt-1'),
      soft('xs', '주문부터 도착까지', 'mt-6'),
      strong('3xl', '평균 1.2일'),
      strong('xl', '달라지는 점', 'mt-6'),
      body('지금까지는 주문한 다음 날 출고했지만, 이제 오후 2시 전에 들어온 주문은 당일에 포장해서 보냅니다. 수도권은 다음 날, 그 밖의 지역은 이틀 안에 받아 보실 수 있습니다.', 'mt-1'),
      strong('lg', '당일 출고', 'mt-4'),
      body('평일 오후 2시 전 주문이 대상입니다. 주말과 공휴일 주문은 다음 평일에 출고합니다.', 'mt-1'),
      soft('sm', '제주와 도서 지역은 하루 더 걸릴 수 있습니다.', 'mt-1'),
    ]
  // 8단계: 요약 화면.
  if (ups === 5)
    return [
      soft('xs', '요약 · 2025년 4월'),
      strong('2xl', '이번 달 요약'),
      soft('lg', '지난달보다 주문이 12% 늘었습니다.', 'mt-1'),
      soft('xs', '매출', 'mt-6'),
      strong('4xl', '1,248만 원'),
      soft('xs', '주문', 'mt-4'),
      strong('3xl', '318건'),
      strong('xl', '많이 팔린 상품', 'mt-6'),
      strong('lg', '한라봉 선물세트', 'mt-1'),
      body('142상자가 나갔고 전체 주문의 45%입니다. 선물 포장을 함께 신청한 주문이 절반을 넘습니다.', 'mt-1'),
      soft('sm', '반품과 취소는 뺀 숫자입니다.', 'mt-1'),
    ]
  // 9단계: 소개 페이지.
  return [
    soft('xs', '제주에서 바로 보냅니다'),
    strong('5xl', '오늘 주문, 오늘 출발'),
    soft('lg', '오후 2시 전에 주문하면 그날 바로 보내 드립니다.', 'mt-1'),
    soft('xs', '당일에 출고한 주문', 'mt-6'),
    strong('4xl', '98%'),
    soft('xs', '주문부터 도착까지 평균', 'mt-4'),
    strong('3xl', '1.2일'),
    strong('2xl', '왜 빠른가요', 'mt-6'),
    strong('xl', '아침에 따서 오후에 보냅니다', 'mt-4'),
    body('농장 옆에 포장하는 곳이 있어서 창고를 거치지 않습니다. 수도권은 다음 날, 그 밖의 지역은 이틀 안에 받아 보실 수 있습니다.', 'mt-1'),
    soft('sm', '제주와 도서 지역은 하루 더 걸릴 수 있습니다.', 'mt-1'),
  ]
}

/** 한 단계의 크기로 직접 정할 수 있는 범위(px). 위는 규칙이 낼 수 있는 가장 큰 크기(108px)보다 조금 넉넉하게 잡는다. */
const SIZE_MIN = 8
const SIZE_MAX = 128

/**
 * 견본의 한 줄에서 그 단계의 크기를 고치는 칸. 단위(px)는 칸 밖에 고정해 두고 숫자만 적는다.
 * 칸은 테두리가 늘 보여서 고칠 수 있는 자리임을 알 수 있다. 직접 정한 값은 진하고 굵게 보이고, 칸을 비우면 규칙의 값으로 돌아간다.
 */
function StepSize({ name, rule, custom, onChange }: { name: string; rule: number; custom: number | null; onChange: (px: number | null) => void }) {
  // 적는 중인 글자. 2를 거쳐 24를 적는 동안처럼 아직 값이 되지 못한 것도 칸에는 그대로 보여야 한다.
  const [draft, setDraft] = useState<string | null>(null)
  const apply = (digits: string) => {
    setDraft(digits)
    if (!digits) return onChange(null)
    const px = Number(digits)
    if (px >= SIZE_MIN && px <= SIZE_MAX) onChange(px === rule ? null : px)
  }
  return (
    <UnitInput
      small
      width="w-14"
      strong={custom !== null}
      label={`${name} 크기`}
      unit="px"
      placeholder={String(rule)}
      title={custom === null ? '숫자를 고치면 이 단계의 크기를 직접 정해요' : `직접 정한 크기예요. 비우면 규칙의 값(${rule}px)으로 돌아가요`}
      digits={draft ?? String(custom ?? rule)}
      // 정수 세 자리까지만 받는다. ↑↓로 범위를 벗어나면 끝 값에 멈춘다.
      onDigits={(digits) => {
        const clean = digits.replace(/\D/g, '')
        apply(clean && Number(clean) > SIZE_MAX ? String(SIZE_MAX) : clean.slice(0, 3))
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

/**
 * 견본의 본문 줄에서 본문 크기를 고치는 칸. 왼쪽의 "본문 크기"와 같은 값이라, 여기서 고치면 한 벌 전체가 따라 바뀐다.
 * 다른 줄의 크기 칸과 달리 직접 정한 값이라는 구분이 없다. 본문 크기는 규칙이 내는 값이 아니라 규칙의 출발점이기 때문이다.
 * 고를 수 있는 범위(13~20px) 밖의 숫자가 적혀 있는 동안은 빨갛게 알리고 반영하지 않는다. 칸을 떠나면 앞의 값으로 돌아간다.
 */
function BaseSize({ base, onChange }: { base: number; onChange: (px: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const ok = (digits: string) => Number(digits) >= BASE_MIN && Number(digits) <= BASE_MAX
  return (
    <UnitInput
      small
      width="w-14"
      label="base 크기"
      unit="px"
      placeholder={String(base)}
      title={`본문 크기예요. ${BASE_MIN}px에서 ${BASE_MAX}px까지 적을 수 있고, 고치면 한 벌 전체가 따라 바뀌어요`}
      invalid={!!draft && !ok(draft)}
      digits={draft ?? String(base)}
      onDigits={(digits) => {
        const clean = digits.replace(/\D/g, '').slice(0, 2)
        setDraft(clean)
        if (clean && ok(clean) && Number(clean) !== base) onChange(Number(clean))
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

/**
 * 견본의 한 줄에서 그 단계의 줄 높이나 글자 사이를 고치는 칸. 크기 칸과 같은 짜임이다.
 * 규칙이 낸 값이 미리 채워져 있고, 고치면 진하고 굵게 보인다. 비우면 규칙의 값으로 돌아간다.
 */
function StepField({
  label,
  unit,
  rule,
  custom,
  negative = false,
  width,
  valid,
  onChange,
}: {
  label: string
  unit: string
  /** 칸의 폭(고정). 위아래 줄의 칸과 폭이 같아야 줄이 맞는다. */
  width: string
  /** 규칙이 낸 값(숫자만). */
  rule: string
  /** 직접 정한 값(숫자만). 없으면 null. */
  custom: string | null
  negative?: boolean
  valid: (digits: string) => boolean
  onChange: (digits: string | null) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <UnitInput
      small
      width={width}
      strong={custom !== null}
      // 받지 못하는 값(홀수 줄 높이 등)이 적혀 있는 동안은 빨갛게 알린다. 그 값은 반영되지 않고, 칸을 떠나면 앞의 값으로 돌아간다.
      invalid={!!draft && !valid(draft)}
      negative={negative}
      label={label}
      unit={unit}
      placeholder={rule}
      title={custom === null ? '숫자를 고치면 이 단계의 값을 직접 정해요' : `직접 정한 값이에요. 비우면 규칙의 값(${rule}${unit})으로 돌아가요`}
      digits={draft ?? custom ?? rule}
      onDigits={(digits) => {
        setDraft(digits)
        if (!digits) return onChange(null)
        if (valid(digits)) onChange(Number(digits) === Number(rule) ? null : digits)
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

/** 줄 높이로 받는 값: 4~200의 짝수(px). 줄 높이가 짝수여야 글자와 아이콘이 줄의 한가운데에 놓인다. */
const validLine = (d: string) => /^\d{1,3}$/.test(d) && Number(d) >= 4 && Number(d) <= 200 && Number(d) % 2 === 0
/** 글자 사이로 받는 값: -0.5~0.5(em). */
const validTrack = (d: string) => /^-?\d*\.?\d+$/.test(d) && Math.abs(Number(d)) <= 0.5

/**
 * 글자 크기 한 벌을 만드는 양식. 글자 크기는 낱개가 아니라 한 벌로 정해야 서로 어울리는지 알 수 있다.
 * 본문 크기와 단계 사이의 간격만 고르면 xs부터 3xl까지 일곱 단계가 줄 높이와 함께 정해진다.
 * 고르는 동안 그 단계들이 위계로 놓인 모습을 이 시스템의 글꼴로 본다.
 */
export function NewSizesForm({
  existing,
  fonts = [],
  onCreate,
  onCancel,
}: {
  /** 이 시스템의 글꼴 종류들(이름과 값). 견본을 어느 글꼴로 그릴지 고른다. 글자 크기는 글꼴마다 따로 정하는 값이 아니라서 보기만 바뀐다. */
  fonts?: { name: string; value: string }[]
  /** 이미 있는 글자 크기의 이름들. 같은 이름은 새 값으로 바뀐다. */
  existing: Set<string>
  onCreate: (steps: SizeStep[]) => void
  onCancel: () => void
}) {
  const firstFont = useContext(PreviewFontContext)
  // 견본을 그릴 글꼴 종류. 처음에는 첫 번째 것이다.
  const [fontName, setFontName] = useState(fonts[0]?.name ?? null)
  const font = fonts.find((f) => f.name === fontName)?.value ?? firstFont
  const [base, setBase] = useState(16)
  // 단계 사이의 배수. 본문보다 큰 단계가 한 단계마다 몇 배씩 커지는지다.
  const [spread, setSpread] = useState(SPREAD_START)
  // 줄 높이의 배수. 보통(1)의 줄 높이에 곱한다. 창에서는 이것을 본문의 줄 높이(px)로 보여 주고 2px씩 조절한다.
  const [leading, setLeading] = useState(1)
  // 글꼴이 불려 온 뒤에 다시 잰다.
  const [loaded, setLoaded] = useState(0)
  // 규칙이 낸 크기 대신 직접 정한 크기(px). 단계의 이름으로 찾는다. 본문 크기나 단계 사이를 바꾸면 모두 지운다(크기를 정하는 규칙이 바뀌었으므로 처음부터 다시 정한다). 줄 높이를 바꿀 때는 남긴다.
  const [custom, setCustom] = useState<Record<string, number>>({})
  // 규칙대로의 한 벌. 직접 정한 크기가 있으면 그 단계만 바꾸고, 줄 높이는 그 크기에 맞춰 다시 낸다.
  // 큰 글자의 글자 사이를 좁힐지. 끄면 글자 사이는 묶지 않는다(글꼴이 정한 그대로).
  const [tighten, setTighten] = useState(true)
  // 본문보다 큰 단계의 수.
  const [ups, setUps] = useState(UPS_START)
  const ruled = useMemo(() => sizeScale(base, spread, leading, tighten, ups), [base, spread, leading, tighten, ups])
  const upCount = ruled.length - 3
  // 한 단계 더 늘릴 수 있는지.
  const canGrow = upCount < UPS_MAX
  // 규칙이 낸 줄 높이(px)와 글자 사이(em, 숫자만) 대신 직접 정한 값. 단계의 이름으로 찾는다.
  // 그 값을 정하는 규칙이 바뀌면 지운다. 줄 높이는 "줄 높이"를, 글자 사이는 "글자 사이"를 바꿀 때, 둘 다 본문 크기나 단계 사이를 바꿀 때.
  const [lines, setLines] = useState<Record<string, string>>({})
  const [tracks, setTracks] = useState<Record<string, string>>({})
  const steps = useMemo(
    () =>
      ruled.map((s) => {
        const px = s.name !== 'base' ? custom[s.name] : undefined
        const sized = px ? { ...s, size: `${px}px`, line: `${lineFor(px, leading)}px`, track: tighten ? trackFor(px) : null } : s
        const line = lines[s.name]
        const track = tracks[s.name]
        return {
          ...sized,
          ...(line !== undefined ? { line: `${line}px` } : {}),
          // 0으로 적으면 글자 사이를 묶지 않는다(글꼴이 정한 그대로).
          ...(track !== undefined ? { track: Number(track) === 0 ? null : `${Number(track)}em` } : {}),
        }
      }),
    [ruled, custom, leading, tighten, lines, tracks],
  )
  const changeBase = (px: number) => {
    setBase(px)
    setCustom({})
    setLines({})
    setTracks({})
  }
  // 단계 수를 바꿀 때도 본문 크기나 단계 사이를 바꿀 때처럼 직접 고친 값을 모두 지운다. 남아 있는 단계의 규칙 값은 그대로지만,
  // 왼쪽의 어느 설정은 지우고 어느 설정은 남기면 무엇이 지워지는지 기억해야 한다. 한 벌의 틀을 바꾸면 처음부터 다시 정한다.
  const changeUps = (next: number) => {
    setUps(next)
    setCustom({})
    setLines({})
    setTracks({})
  }
  const changeSpread = (next: number) => {
    setSpread(next)
    setCustom({})
    setLines({})
    setTracks({})
  }
  // 단계 사이는 다섯 칸 가운데 하나다. 지금 배수가 몇 번째 칸인지.
  const spreadAt = SPREAD_STEPS.findIndex((s) => s.ratio === spread)
  /** 단계 사이를 한 칸 좁히거나 넓힌다. */
  const stepSpread = (dir: 1 | -1) => changeSpread(SPREAD_STEPS[Math.max(0, Math.min(SPREAD_STEPS.length - 1, spreadAt + dir))].ratio)
  // 본문의 줄 높이. 고르는 것은 이 값(px)이고, 다른 단계는 같은 배수로 따라간다.
  const lineRange = baseLineRange(base)
  const baseLine = lineFor(base, leading)
  /** 본문의 줄 높이를 2px 줄이거나 늘린다. 직접 고친 줄 높이는 지운다(줄 높이를 정하는 규칙이 바뀌었으므로). */
  const stepLine = (dir: 1 | -1) => {
    const target = Math.max(lineRange.min, Math.min(lineRange.max, baseLine + dir * 2))
    setLeading(target / lineRange.normal)
    setLines({})
  }
  /** 직접 정한 값의 목록에서 한 단계의 것을 바꾸거나(null이면) 지운다. */
  const put = (now: Record<string, string>, name: string, value: string | null) => {
    const { [name]: _gone, ...rest } = now
    return value === null ? rest : { ...rest, [name]: value }
  }
  const setSize = (name: string, px: number | null) =>
    setCustom((now) => {
      const { [name]: _gone, ...rest } = now
      return px === null ? rest : { ...rest, [name]: px }
    })
  // 마우스를 올린 단계. 표의 줄과 화면 예시의 글자를 서로 짚어 준다. 글자 앞에 단계의 이름을 적어 두는 대신 이렇게 짝을 보여 준다.
  const [hot, setHot] = useState<string | null>(null)
  // 단계의 이름을 직접 고친 것. 원래 이름으로 찾는다. 고치지 않은 단계는 원래 이름 그대로다.
  const [names, setNames] = useState<Record<string, string>>({})
  const nameOf = (name: string) => names[name] ?? name
  const problem = nameProblem(steps.map((s) => nameOf(s.name)))
  const replaced = steps.filter((s) => existing.has(nameOf(s.name))).length

  // 줄 상자 안에서 글자의 위 여백과 아래 여백(px). 화면에 그려진 뒤 실제 자리를 재서 채운다.
  // 한글(가나다라마바사)의 모양을 기준으로 잰다. 줄마다 적힌 글이 달라도 같은 기준으로 견주기 위해서다.
  const scale = useRef<HTMLDivElement>(null)
  const [gaps, setGaps] = useState<Record<string, { top: number; bottom: number; icon?: number }>>({})
  useEffect(() => {
    let alive = true
    Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(`${w} 16px ${font ?? 'sans-serif'}`, INK + EXAMPLE_ROWS.map((e) => e.text).join('') + 'H')))
      .then(() => alive && setLoaded((n) => n + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [font])
  useLayoutEffect(() => {
    const pen = document.createElement('canvas').getContext('2d')
    if (!scale.current || !pen) return
    const next: typeof gaps = {}
    // 줄(data-line)은 줄 상자 안에서, 예시(data-ex)는 그 글을 담은 상자(data-box) 안에서 잰다.
    // 줄은 한글의 평균적인 모양으로, 예시는 거기 적힌 글 그대로의 모양으로 잰다(버튼에서 눈에 보이는 것은 그 글이다).
    const root = scale.current.closest('form') ?? scale.current
    for (const el of root.querySelectorAll<HTMLElement>('[data-ex]')) {
      const style = getComputedStyle(el)
      const box = el.closest<HTMLElement>('[data-box]') ?? el
      const text = el.dataset.ex ? (el.textContent ?? INK) : INK
      // 높이가 없는 조각을 글 끝에 잠깐 넣어 기준선의 자리를 읽는다.
      const probe = document.createElement('span')
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
      el.appendChild(probe)
      const baseline = probe.getBoundingClientRect().top
      probe.remove()
      // 글자의 모양은 100px로 크게 그려서 재고 실제 크기로 줄인다. 작은 크기로 재면 픽셀 단위로 뭉개진다.
      pen.font = `${style.fontWeight} 100px ${style.fontFamily}`
      const ink = pen.measureText(text)
      const k = parseFloat(style.fontSize) / 100
      const rect = box.getBoundingClientRect()
      // 아이콘이 함께 있으면 글자 모양의 가운데가 아이콘의 가운데보다 얼마나 아래에 있는지도 잰다(음수면 위).
      const svg = el.dataset.ex ? box.querySelector('svg')?.getBoundingClientRect() : undefined
      const inkCenter = baseline - ((ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) * k) / 2
      next[el.dataset.line ?? `ex:${el.dataset.ex}`] = {
        top: baseline - ink.actualBoundingBoxAscent * k - rect.top,
        bottom: rect.bottom - (baseline + ink.actualBoundingBoxDescent * k),
        ...(svg ? { icon: inkCenter - (svg.top + svg.height / 2) } : {}),
      }
    }
    setGaps(next)
  }, [steps, font, loaded])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (problem) return
    onCreate(steps.map((s) => ({ ...s, name: nameOf(s.name) })))
  }

  // 처음 열었을 때와 달라진 것이 있는지. 견본의 글꼴은 만들어지는 값이 아니라 보기만 바꾸는 것이라 세지 않는다.
  const changed =
    base !== 16 ||
    leading !== 1 ||
    ups !== UPS_START ||
    spread !== SPREAD_START ||
    !tighten ||
    [custom, lines, tracks].some((o) => Object.keys(o).length > 0) ||
    Object.entries(names).some(([from, to]) => from !== to)
  /** 설정과 직접 고친 값(크기, 줄 높이, 글자 사이, 이름)을 모두 처음으로 돌린다. 견본의 글꼴은 그대로 둔다. */
  function reset() {
    setBase(16)
    setLeading(1)
    setUps(UPS_START)
    setSpread(SPREAD_START)
    setTighten(true)
    setCustom({})
    setLines({})
    setTracks({})
    setNames({})
  }

  return (
    // 창의 높이는 화면에 맞춰 고정되어 있다(Modal의 tall). 이 양식이 그 높이를 채우고, 아래의 버튼 줄은 늘 같은 자리에 있다.
    // 고르는 값에 따라 달라지는 것은 표의 내용뿐이고, 표가 남는 높이를 넘으면 표 안에서만 스크롤된다.
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 gap-6">
      <div className="min-h-0 w-56 shrink-0 space-y-4 overflow-y-auto">
        <div>
          <p className={LABEL}>본문 크기</p>
          <span className="flex h-8 items-center gap-1">
            <button type="button" aria-label="본문 작게" disabled={base <= BASE_MIN} onClick={() => changeBase(base - 1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={1.5} />
            </button>
            <span data-base className="w-20 text-center text-sm tabular-nums">
              {base}px
            </span>
            <button type="button" aria-label="본문 크게" disabled={base >= BASE_MAX} onClick={() => changeBase(base + 1)} className={STEP_BUTTON}>
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        {/* 줄 높이는 본문의 줄 높이(px)로 고른다. 언제나 짝수 px이라 2px씩 움직이고, 다른 단계는 같은 비율로 따라간다(글자가 클수록 덜 띄우는 것은 그대로다). */}
        <div>
          <p className={LABEL}>본문 줄 높이</p>
          <span className="flex h-8 items-center gap-1">
            <button type="button" aria-label="줄 높이 좁게" disabled={baseLine <= lineRange.min} onClick={() => stepLine(-1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={1.5} />
            </button>
            <span data-leading title="본문 크기의 줄 높이. 다른 단계는 같은 비율로 따라가요" className="w-20 text-center text-sm tabular-nums">
              {baseLine}px
            </span>
            <button type="button" aria-label="줄 높이 넓게" disabled={baseLine >= lineRange.max} onClick={() => stepLine(1)} className={STEP_BUTTON}>
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        {/* 설정은 두 묶음이다. 위의 둘(본문 크기, 본문 줄 높이)은 기준이 되는 한 줄을 정하고, 아래의 둘(단계 수, 단계 사이)은 그 기준에서 한 벌을 어떻게 펼칠지를 정한다.
            나머지 값이 모두 본문에서 계산되므로 본문이 먼저다. 묶음 사이는 묶음 안(16px)보다 넓게 24px 띄운다. */}
        {/* 단계의 수. 본문 아래의 둘과 본문은 늘 있고, 본문보다 큰 단계를 둘에서 여섯까지 고른다. 전체로는 5단계에서 9단계다. */}
        <div className="pt-2">
          <p className={LABEL}>단계 수</p>
          <span className="flex h-8 items-center gap-1">
            <button type="button" aria-label="단계 줄이기" disabled={upCount <= UPS_MIN} onClick={() => changeUps(upCount - 1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={1.5} />
            </button>
            <span data-count title={`가장 큰 단계는 ${nameOf(ruled[ruled.length - 1].name)} ${ruled[ruled.length - 1].size}`} className="w-20 text-center text-sm tabular-nums">
              {ruled.length}단계
            </span>
            <button
              type="button"
              aria-label="단계 늘리기"
              disabled={!canGrow}
              onClick={() => changeUps(upCount + 1)}
              className={STEP_BUTTON}
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        {/* 본문 크기처럼 - +로 조절한다. 세 가지 가운데 고르게 하면 그 사이의 값이나 더 큰 대비를 원할 때 단계마다 손으로 고쳐야 한다. */}
        <div>
          <p className={LABEL}>단계 사이</p>
          <span className="flex h-8 items-center gap-1">
            <button type="button" aria-label="단계 사이 좁게" disabled={spreadAt <= 0} onClick={() => stepSpread(-1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={1.5} />
            </button>
            {/* 배수의 숫자 대신 이름을 보여 준다. 숫자는 마우스를 올리면 나온다. */}
            <span data-spread title={`한 단계마다 ${spread}배씩 커져요`} className="w-20 text-center text-sm">
              {SPREAD_STEPS[spreadAt]?.label}
            </span>
            <button type="button" aria-label="단계 사이 넓게" disabled={spreadAt >= SPREAD_STEPS.length - 1} onClick={() => stepSpread(1)} className={STEP_BUTTON}>
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        {/* 글자 사이를 글자 크기에 묶을지. 큰 글자일수록 좁힌다. 16px 이하의 글자는 어느 쪽을 골라도 글꼴이 정한 그대로다. */}
        <div className="pt-2">
          <p className={LABEL}>글자 사이</p>
          <div role="radiogroup" aria-label="글자 사이" className="grid grid-cols-2 gap-1 rounded-md bg-hover p-1">
            {[
              { on: false, label: '그대로' },
              { on: true, label: '큰 글자 좁게' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={o.on === tighten}
                onClick={() => {
                  setTighten(o.on)
                  setTracks({})
                }}
                className={`h-6 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
                  o.on === tighten ? 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {/* 위의 것들은 만들어지는 값을 정하고, 이것은 보기만 바꾼다. 그래서 구분선 아래 맨 끝에 둔다.
            견본을 그리는 글꼴. 글꼴 종류가 둘 이상이면 고를 수 있다. 글꼴마다 글자가 줄 안에 앉는 자리가 달라서, 글꼴을 바꾸면 오른쪽의 위아래 여백 숫자가 달라진다. */}
        {fonts.length > 0 && (
          <div className="border-t border-hairline pt-4">
            <p className={LABEL}>견본의 글꼴</p>
            {fonts.length === 1 ? (
              <p className="text-sm">
                <span className="font-mono text-ink-faint">{fonts[0].name}</span> {shownFont(fonts[0].value)}
              </p>
            ) : (
              <div role="radiogroup" aria-label="견본의 글꼴" className="space-y-1">
                {fonts.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    role="radio"
                    aria-checked={f.name === fontName}
                    onClick={() => setFontName(f.name)}
                    className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-selection focus-visible:outline-2 ${
                      f.name === fontName ? 'bg-selection-soft' : 'hover:bg-hover'
                    }`}
                  >
                    <span className="shrink-0 font-mono text-xs text-ink-faint">{f.name}</span>
                    <span className="min-w-0 flex-1 truncate">{shownFont(f.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 창이 좁으면 표, 예시 상자, 화면 예시가 위아래로 놓이고 이 상자가 통째로 스크롤된다. 넓으면 표와 화면 예시가 좌우로 놓이고 저마다 높이를 채운다. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto min-[1700px]:flex-row min-[1700px]:gap-6 min-[1700px]:overflow-visible">
      <div className="min-w-0 flex-1 min-[1700px]:flex min-[1700px]:min-h-0 min-[1700px]:flex-col">
        {/* 큰 것부터 작은 것 순서로, 한 줄에 한 단계. 높이는 가장 크게 골랐을 때에 맞춰 고정해서 고르는 동안 창이 늘었다 줄었다 하지 않는다. */}
        <div ref={scale} data-scale className="min-h-[360px] space-y-1 rounded-md border border-hairline px-4 py-3 min-[1700px]:min-h-0 min-[1700px]:flex-1 min-[1700px]:overflow-y-auto">
          {[...steps].reverse().map((s) => (
            <div
              key={s.name}
              data-step={s.name}
              onMouseEnter={() => setHot(s.name)}
              onMouseLeave={() => setHot(null)}
              className="flex items-center gap-3"
            >
              {/* 마우스를 올렸을 때의 회색 바탕은 이름, 값, 쓰이는 곳까지만 덮는다(높이 32px). 줄 전체를 덮으면 견본 문장의 크기에 따라 줄마다 높이가 달라진다.
                  견본 문장은 바탕 밖에 두고, 화면 예시의 글자처럼 1px 선을 둘러 표시한다.
                  바탕의 좌우 여백은 그 끝에 놓인 것의 위아래 여백과 같게 한다. 왼쪽 끝은 이름 칸(24px, 위아래 4px)이라 4px, 오른쪽 끝은 쓰이는 곳의 글자(줄 높이 16px, 위아래 8px)라 8px. */}
              <span data-hot={hot === s.name || undefined} className={`-ml-1 flex h-8 shrink-0 items-center gap-3 rounded-md pr-2 pl-1 ${hot === s.name ? 'bg-hover' : ''}`}>
              {/* 이름은 미리 채워져 있고, 다른 이름을 쓰고 싶을 때만 고친다. */}
              <StepName label={`${s.name} 이름`} value={nameOf(s.name)} onChange={(name) => setNames({ ...names, [s.name]: name })} />
              {/* 크기, 줄 높이, 글자 사이는 단계마다 직접 고칠 수 있다(본문 줄의 크기 칸은 왼쪽의 본문 크기와 같은 값이다). 줄 높이와 글자 사이는 고친 크기에 맞춰 따라오고, 직접 고친 것은 따라가지 않는다. */}
              <span className="flex w-60 shrink-0 items-center font-mono text-xs whitespace-nowrap text-ink-faint">
                {s.name === 'base' ? (
                  // 본문 줄의 크기도 다른 줄처럼 칸이다. 여기서 고치는 것은 왼쪽의 "본문 크기"와 같은 값이다.
                  <BaseSize base={base} onChange={changeBase} />
                ) : (
                  <StepSize
                    // 본문 크기나 단계 사이를 바꾸면 칸을 새로 만든다. 적는 중이던 글자가 남지 않게 한다.
                    key={`${base}:${spread}`}
                    name={s.name}
                    rule={parseFloat(ruled.find((r) => r.name === s.name)!.size)}
                    custom={custom[s.name] ?? null}
                    onChange={(px) => setSize(s.name, px)}
                  />
                )}
                <span className="px-1">/</span>
                <StepField
                  key={`line:${base}:${spread}:${leading}`}
                  label={`${s.name} 줄 높이`}
                  unit="px"
                  width="w-14"
                  rule={String(lineFor(parseFloat(s.size), leading))}
                  custom={lines[s.name] ?? null}
                  valid={validLine}
                  onChange={(d) => setLines((now) => put(now, s.name, d))}
                />
                <span className="px-1">/</span>
                <StepField
                  key={`track:${base}:${spread}:${tighten}`}
                  label={`${s.name} 글자 사이`}
                  unit="em"
                  // 가장 긴 값(-0.015)이 들어가는 폭.
                  width="w-[76px]"
                  negative
                  rule={((tighten && trackFor(parseFloat(s.size))) || '0').replace(/em$/, '')}
                  custom={tracks[s.name] ?? null}
                  valid={validTrack}
                  onChange={(d) => setTracks((now) => put(now, s.name, d))}
                />
              </span>
              {/* 이 크기가 흔히 쓰이는 곳. */}
              <span data-use className="w-36 shrink-0 text-xs whitespace-nowrap text-ink-soft">
                {/* 5단계면 xl이 가장 큰 단계라 화면 제목까지 맡는다. */}
                {s.name === 'xl' && upCount === 2 ? '화면 제목, 구역 제목' : SAMPLES[s.name].use}
              </span>
              </span>
              {/* 글의 뒤에 바탕(선택 색 35%)을 깔아 줄 높이를 보여 준다. 옅으면 흰 바탕과 구분이 안 되어 줄 상자의 위아래 끝이 보이지 않는다. 바탕의 높이가 곧 줄 높이이고, 글자가 그 안에서 위아래 가운데에 오는지를 눈으로 본다.
                  글자의 자리는 손대지 않고 글꼴이 정한 그대로 둔다. 실제 화면에서도 이렇게 놓인다. */}
              <span className="min-w-0 flex-1">
                <span
                  data-line={s.name}
                  className={`block w-fit max-w-full truncate bg-selection/35 outline-offset-2 outline-selection ${hot === s.name ? 'outline-1' : ''}`}
                  style={{ fontFamily: font, fontSize: s.size, lineHeight: s.line, letterSpacing: s.track ?? undefined, fontWeight: weightOf(s.name) }}
                >
                  {SAMPLES[s.name].text}
                </span>
              </span>
              {/* 위아래 여백의 숫자는 여기에 적지 않는다. 글자가 가운데에 오는지가 중요한 것은 높이가 정해진 상자(버튼, 칩) 안이라, 화면 예시의 상자들 아래에만 적는다. */}
            </div>
          ))}
        </div>
        {/* 이 크기들이 실제로 들어가는 것들. 높이가 정해진 상자 안에 글이 놓이는 버튼, 칩, 뱃지, 입력칸은 위아래 가운데가 조금만 어긋나도 눈에 띈다.
            상자의 높이는 그 크기의 줄 높이에 위아래 여백을 더한 것이라, 줄 높이를 바꾸면 함께 바뀐다. */}
        <div data-examples className="mt-2 grid shrink-0 grid-cols-[84px_repeat(5,minmax(0,1fr))] items-start gap-x-4 gap-y-3 rounded-md border border-hairline px-4 py-3">
          {/* 머리 줄: 열마다의 종류. */}
          <span />
          {EXAMPLE_ROWS.map((kind) => (
            <p key={kind.id} data-ex-head={kind.id} className="text-center text-xs text-ink-soft">
              {kind.label}
            </p>
          ))}
          {EXAMPLE_SIZES.map((size) => {
            const step = steps.find((x) => x.name === size)!
            const slot = slotOf(size)
            return [
              // 줄의 이름(크기)은 상자와 같은 높이의 자리 안에서 가운데에 둔다.
              <p key={size} data-ex-size={size} className="flex flex-col justify-center font-mono text-xs leading-4 text-ink-faint" style={{ height: slot }}>
                <span className="text-ink-soft">{nameOf(size)}</span>
                <span className="whitespace-nowrap">
                  {step.size} / {step.line}
                </span>
              </p>,
              ...EXAMPLE_ROWS.map((kind) => {
                const cell = kind.cells[size]
                if (!cell) return <span key={`${kind.id}:${size}`} />
                const gap = gaps[`ex:${kind.id}:${size}`]
                const shift = gap ? shiftOf(gap) : 0
                return (
                  // 열 안의 것들(종류의 이름, 상자, 숫자)은 모두 열의 가운데에 맞춘다. 상자의 폭이 종류와 크기마다 달라서 왼쪽에 맞추면 열이 들쭉날쭉해 보인다.
                  <div key={`${kind.id}:${size}`} data-ex-cell={`${kind.id}:${size}`} className="text-center">
                    <span className="flex items-center justify-center" style={{ height: slot }}>
                      <span
                        data-box
                        title={nameOf(size)}
                        onMouseEnter={() => setHot(size)}
                        onMouseLeave={() => setHot(null)}
                        className={`inline-flex items-center outline-offset-2 outline-selection ${hot === size ? 'outline-1' : ''} ${cell.box}`}
                        style={{ fontFamily: font, fontSize: step.size, lineHeight: step.line, letterSpacing: step.track ?? undefined, fontWeight: kind.weight, height: parseFloat(step.line) + cell.pad * 2, paddingInline: Math.round(((parseFloat(step.line) + cell.pad * 2) * kind.side) / 2) * 2 }}
                      >
                        {kind.icon && <CheckIcon size={size === 'xs' ? 14 : 16} strokeWidth={2} className="mr-1 shrink-0" />}
                        {/* 글자의 자리는 손대지 않는다. 컴포넌트로 내보낼 때와 같이 줄 상자를 상자 가운데에 놓을 뿐이라, 아래에 적는 숫자가 실제 결과물의 것이다. */}
                        <span data-ex={`${kind.id}:${size}`}>{kind.text}</span>
                      </span>
                    </span>
                    {/* 글자가 상자의 가운데에서 어느 쪽으로 얼마나 밀렸는지만 적는다. 알고 싶은 것은 치우침이지 여백의 크기가 아니다. 위아래 여백은 마우스를 올리면 나온다. */}
                    <p
                      title={gap ? `위 여백 ${gap.top.toFixed(1)}px · 아래 여백 ${gap.bottom.toFixed(1)}px` : undefined}
                      className={`mt-1 font-mono text-xs leading-4 whitespace-nowrap tabular-nums ${gap && Math.abs(shift) > OFF ? 'text-danger' : 'text-ink-faint'}`}
                    >
                      {gap ? (Math.abs(shift) < 0.05 ? '가운데' : `${shift > 0 ? '위로' : '아래로'} ${Math.abs(shift).toFixed(1)}`) : '\u00a0'}
                    </p>
                    {/* 아이콘과 글자의 높이 차이는 따로 적지 않는다. 아이콘은 상자의 가운데에 놓이므로 그 차이는 위의 치우침과 늘 같은 값이다. */}
                  </div>
                )
              }),
            ]
          })}
        </div>
      </div>
      {/* 이 한 벌이 한 화면에 놓인 모습. 왼쪽의 표는 단계끼리 견주는 것이고, 이것은 쓰였을 때를 보는 것이다.
          여기서 볼 것은 글자 크기뿐이라 글 한 편만 위계대로 놓는다. 그 크기가 들어가는 상자들(버튼, 입력칸, 칩, 뱃지)은 표 아래에 따로 있다.
          창이 넓으면(1700px 이상) 표의 오른쪽에, 좁으면 표의 아래에 놓인다.
          이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. */}
      <div data-screen className="w-full shrink-0 rounded-md border border-hairline bg-canvas text-ink min-[1700px]:min-h-0 min-[1700px]:w-[560px] min-[1700px]:overflow-y-auto">
        <div className="p-6">
          {pageRows(upCount).map((row, i) => {
            const stepName = row.step
            const s = steps.find((x) => x.name === stepName)
            if (!s) return null
            return (
              <div key={i} data-page={stepName} className={row.top ?? ''}>
                {/* 폭을 글자에 맞춰서, 마우스를 올렸을 때의 선이 빈 줄 끝까지 가지 않고 글자만 두른다. */}
                <p
                  title={nameOf(stepName)}
                  onMouseEnter={() => setHot(stepName)}
                  onMouseLeave={() => setHot(null)}
                  className={`w-fit rounded-sm outline-offset-2 outline-selection ${hot === stepName ? 'outline-1' : ''} ${row.soft ? 'text-ink-soft' : ''}`}
                  style={{ fontFamily: font, fontSize: s.size, lineHeight: s.line, letterSpacing: s.track ?? undefined, fontWeight: row.weight }}>
                  {row.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      </div>
      </div>
        <div className="mt-3 flex shrink-0 items-center justify-end gap-2">
          {/* 바꾼 것을 모두 처음으로 돌린다. 만들기와 취소처럼 창 전체에 대한 일이라 같은 줄에 두되, 실수로 누르지 않게 반대쪽 끝에 둔다. 바꾼 것이 없으면 꺼져 있다. */}
          <Button variant="ghost" className="mr-auto" disabled={!changed} title="설정과 직접 고친 값을 모두 처음으로 돌려요" onClick={reset}>
            <RotateCcw size={16} strokeWidth={1.5} />
            원래대로
          </Button>
          {/* 이미 있는 단계가 새 값으로 바뀌는 것은 되돌리기 전에 알아야 하는 일이라 알린다. */}
          {problem ? (
            <span role="alert" className="mr-1 text-sm text-danger">
              {problem}
            </span>
          ) : (
            replaced > 0 && <span className="mr-1 text-sm text-ink-faint">이미 있는 {replaced}개는 새 값으로 바뀌어요.</span>
          )}
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="submit">
            만들기
          </Button>
        </div>
    </form>
  )
}
