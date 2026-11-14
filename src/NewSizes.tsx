import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check as CheckIcon, Minus, Plus } from 'lucide-react'
import { PreviewFontContext } from './ColorUses'
import { shownFont } from './lib/fonts'
import { BASE_MAX, BASE_MIN, LEADINGS, SPREADS, lineFor, sizeScale, type Leading, type Spread } from './lib/presets'
import { Button } from './ui'

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
/** 위 여백, 아래 여백, 그리고 가운데에서 밀린 양을 적은 글. */
function gapText(gap: { top: number; bottom: number }) {
  const shift = shiftOf(gap)
  const where = Math.abs(shift) < 0.05 ? '가운데' : `${shift > 0 ? '위로' : '아래로'} ${Math.abs(shift).toFixed(1)}`
  return `위 ${gap.top.toFixed(1)} · 아래 ${gap.bottom.toFixed(1)} · ${where}`
}

const LABEL = 'mb-1 text-sm font-[550] text-ink-faint'
const STEP_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent'

/**
 * 크기가 실제로 들어가는 것들의 예시. size는 쓰는 글자 크기, pad는 줄 높이 위아래에 더하는 여백(px), box는 상자의 모양.
 * 모두 높이가 정해진 상자 안에 글이 놓이는 것들이라 위아래 가운데가 중요하다.
 */
const EXAMPLES: { id: string; label: string; size: string; weight: number; pad: number; box: string; text: string; icon?: boolean }[] = [
  { id: 'button', label: '버튼', size: 'sm', weight: 600, pad: 8, box: 'rounded-md bg-ink px-3 text-white', text: '저장하기' },
  { id: 'button-lg', label: '큰 버튼', size: 'base', weight: 600, pad: 8, box: 'rounded-md bg-ink px-4 text-white', text: '시작하기' },
  { id: 'button-icon', label: '아이콘 버튼', size: 'sm', weight: 600, pad: 8, box: 'rounded-md border border-hairline px-3', text: '완료', icon: true },
  { id: 'input', label: '입력칸', size: 'sm', weight: 400, pad: 8, box: 'w-40 rounded-md border border-hairline px-3 text-ink-faint', text: '이메일 주소' },
  { id: 'chip', label: '칩', size: 'xs', weight: 500, pad: 4, box: 'rounded-full bg-hover px-2', text: '디자인' },
  { id: 'badge', label: '뱃지', size: 'xs', weight: 700, pad: 0, box: 'rounded-sm bg-selection px-1 text-white', text: '필수' },
]

/** 예시 상자가 놓이는 자리의 높이(px). 가장 큰 상자(본문을 가장 크게, 줄 높이를 가장 넓게 골랐을 때의 가장 여백이 큰 것)의 높이다. */
const EXAMPLE_SLOT = lineFor(BASE_MAX, LEADINGS[LEADINGS.length - 1].id) + Math.max(...EXAMPLES.map((e) => e.pad)) * 2

/** 본문 문단의 견본. 단계 견본과 같은 화면(비밀번호 바꾸기)에 나올 설명글이고, 세 줄에 걸치는 길이다. */
const PARAGRAPH =
  '비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요. 다른 서비스에서 쓰는 비밀번호와 같으면 한 곳에서 새어 나갔을 때 여기까지 위험해집니다. 석 달에 한 번쯤 바꾸면 더 안전합니다.'
/** 본문 문단이 놓이는 자리의 높이(px). 본문을 가장 크게, 줄 높이를 가장 넓게 골랐을 때의 세 줄이다. */
const PARAGRAPH_SLOT = lineFor(BASE_MAX, LEADINGS[LEADINGS.length - 1].id) * 3

/**
 * 단계마다 그 크기가 흔히 쓰이는 곳(use)과, 그 자리에 실제로 놓일 법한 글(text).
 * 한 화면(설정의 비밀번호 바꾸기)에서 나올 글들로 맞춰서, 위에서 아래로 읽으면 한 화면의 위계가 된다.
 */
const SAMPLES: Record<string, { use: string; text: string }> = {
  '3xl': { use: '페이지 제목', text: '설정' },
  '2xl': { use: '구역 제목', text: '계정과 보안' },
  xl: { use: '카드·창 제목', text: '비밀번호 바꾸기' },
  lg: { use: '소제목', text: '새 비밀번호' },
  base: { use: '본문', text: '영문과 숫자를 섞어 8자 이상으로 정해 주세요.' },
  sm: { use: '버튼·입력칸·설명', text: '저장하기 · 이메일 주소를 입력하세요' },
  xs: { use: '이름표·캡션', text: '필수 · 3분 전에 바꿈 · NEW' },
}

/** 한 단계의 크기로 직접 정할 수 있는 범위(px). */
const SIZE_MIN = 8
const SIZE_MAX = 96

/**
 * 견본의 한 줄에서 그 단계의 크기를 고치는 칸. 단위(px)는 칸 밖에 고정해 두고 숫자만 적는다.
 * 규칙이 낸 값은 옅게, 직접 정한 값은 진하게 보인다. 칸을 비우면 규칙의 값으로 돌아간다.
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
    <input
      aria-label={`${name} 크기`}
      inputMode="numeric"
      placeholder={String(rule)}
      title={custom === null ? '숫자를 고치면 이 단계의 크기를 직접 정해요' : `직접 정한 크기예요. 비우면 규칙의 값(${rule}px)으로 돌아가요`}
      className={`h-6 w-8 rounded-sm border border-transparent bg-transparent pr-1 text-right font-mono text-xs tabular-nums outline-none hover:border-hairline focus:border-selection focus:bg-canvas ${
        custom === null ? 'text-ink-faint' : 'font-[650] text-ink'
      }`}
      value={draft ?? String(custom ?? rule)}
      onChange={(e) => apply(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') return e.preventDefault()
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
        e.preventDefault()
        const next = (custom ?? rule) + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)
        apply(String(Math.max(SIZE_MIN, Math.min(SIZE_MAX, next))))
      }}
    />
  )
}

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
  onCreate: (steps: { name: string; size: string; line: string }[]) => void
  onCancel: () => void
}) {
  const firstFont = useContext(PreviewFontContext)
  // 견본을 그릴 글꼴 종류. 처음에는 첫 번째 것이다.
  const [fontName, setFontName] = useState(fonts[0]?.name ?? null)
  const font = fonts.find((f) => f.name === fontName)?.value ?? firstFont
  const [base, setBase] = useState(16)
  const [spread, setSpread] = useState<Spread>('normal')
  const [leading, setLeading] = useState<Leading>('normal')
  // 글꼴이 불려 온 뒤에 다시 잰다.
  const [loaded, setLoaded] = useState(0)
  // 규칙이 낸 크기 대신 직접 정한 크기(px). 단계의 이름으로 찾는다. 본문 크기나 단계 사이를 바꿔도 직접 정한 것은 그대로 둔다.
  const [custom, setCustom] = useState<Record<string, number>>({})
  // 규칙대로의 한 벌. 직접 정한 크기가 있으면 그 단계만 바꾸고, 줄 높이는 그 크기에 맞춰 다시 낸다.
  const ruled = useMemo(() => sizeScale(base, spread, leading), [base, spread, leading])
  const steps = useMemo(
    () => ruled.map((s) => (custom[s.name] && s.name !== 'base' ? { ...s, size: `${custom[s.name]}px`, line: `${lineFor(custom[s.name], leading)}px` } : s)),
    [ruled, custom, leading],
  )
  const setSize = (name: string, px: number | null) =>
    setCustom((now) => {
      const { [name]: _gone, ...rest } = now
      return px === null ? rest : { ...rest, [name]: px }
    })
  const baseStep = steps.find((s) => s.name === 'base')!
  const replaced = steps.filter((s) => existing.has(s.name)).length

  // 줄 상자 안에서 글자의 위 여백과 아래 여백(px). 화면에 그려진 뒤 실제 자리를 재서 채운다.
  // 한글(가나다라마바사)의 모양을 기준으로 잰다. 줄마다 적힌 글이 달라도 같은 기준으로 견주기 위해서다.
  const scale = useRef<HTMLDivElement>(null)
  const [gaps, setGaps] = useState<Record<string, { top: number; bottom: number; icon?: number }>>({})
  useEffect(() => {
    let alive = true
    Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(`${w} 16px ${font ?? 'sans-serif'}`, INK + EXAMPLES.map((e) => e.text).join('') + 'H')))
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
    const root = scale.current.parentElement ?? scale.current
    for (const el of root.querySelectorAll<HTMLElement>('[data-line], [data-ex]')) {
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
    onCreate(steps)
  }

  return (
    <form onSubmit={submit} className="flex gap-6">
      <div className="w-56 shrink-0 space-y-4">
        <div>
          <p className={LABEL}>본문 크기</p>
          <span className="flex h-8 items-center gap-1">
            <button type="button" aria-label="본문 작게" disabled={base <= BASE_MIN} onClick={() => setBase(base - 1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={1.5} />
            </button>
            <span data-base className="w-11 text-center text-sm tabular-nums">
              {base}px
            </span>
            <button type="button" aria-label="본문 크게" disabled={base >= BASE_MAX} onClick={() => setBase(base + 1)} className={STEP_BUTTON}>
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        <div>
          <p className={LABEL}>단계 사이</p>
          <div role="radiogroup" aria-label="단계 사이" className="grid grid-cols-3 gap-1 rounded-md bg-hover p-1">
            {SPREADS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === spread}
                onClick={() => setSpread(s.id)}
                className={`h-6 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
                  s.id === spread ? 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {/* 줄 높이를 정하는 방식. 어느 것을 골라도 줄 높이는 짝수 px이고, 글자가 클수록 덜 띄운다. */}
        <div>
          <p className={LABEL}>줄 높이</p>
          <div role="radiogroup" aria-label="줄 높이" className="grid grid-cols-3 gap-1 rounded-md bg-hover p-1">
            {LEADINGS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={l.id === leading}
                onClick={() => setLeading(l.id)}
                className={`h-6 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
                  l.id === leading ? 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {l.label}
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

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 큰 것부터 작은 것 순서로, 한 줄에 한 단계. 높이는 가장 크게 골랐을 때에 맞춰 고정해서 고르는 동안 창이 늘었다 줄었다 하지 않는다. */}
        <div ref={scale} data-scale className="h-[340px] space-y-1 overflow-hidden rounded-md border border-hairline px-4 py-3">
          {[...steps].reverse().map((s) => (
            <div key={s.name} data-step={s.name} className="flex items-center gap-3">
              <span className="w-8 shrink-0 font-mono text-xs text-ink-faint">{s.name}</span>
              {/* 크기는 단계마다 직접 고칠 수 있다(본문은 왼쪽의 본문 크기로 정한다). 줄 높이는 고친 크기에 맞춰 따라온다. */}
              <span className="flex w-28 shrink-0 items-center gap-1 font-mono text-xs whitespace-nowrap text-ink-faint">
                {s.name === 'base' ? (
                  <span className="w-8 pr-1 text-right">{parseFloat(s.size)}</span>
                ) : (
                  <StepSize
                    name={s.name}
                    rule={parseFloat(ruled.find((r) => r.name === s.name)!.size)}
                    custom={custom[s.name] ?? null}
                    onChange={(px) => setSize(s.name, px)}
                  />
                )}
                px / {s.line}
              </span>
              {/* 이 크기가 흔히 쓰이는 곳. */}
              <span data-use className="w-28 shrink-0 text-xs whitespace-nowrap text-ink-soft">{SAMPLES[s.name].use}</span>
              {/* 글의 뒤에 바탕(선택 색 35%)을 깔아 줄 높이를 보여 준다. 옅으면 흰 바탕과 구분이 안 되어 줄 상자의 위아래 끝이 보이지 않는다. 바탕의 높이가 곧 줄 높이이고, 글자가 그 안에서 위아래 가운데에 오는지를 눈으로 본다.
                  글자의 자리는 손대지 않고 글꼴이 정한 그대로 둔다. 실제 화면에서도 이렇게 놓인다. */}
              <span className="min-w-0 flex-1">
                <span
                  data-line={s.name}
                  className="block w-fit max-w-full truncate bg-selection/35"
                  style={{ fontFamily: font, fontSize: s.size, lineHeight: s.line, fontWeight: weightOf(s.name) }}
                >
                  {SAMPLES[s.name].text}
                </span>
              </span>
              {/* 줄 상자 안에서 글자의 위 여백과 아래 여백, 그리고 글자가 가운데에서 밀린 양. 1px 안쪽으로 밀리는 것은 브라우저가 기준선을 화면 픽셀에 맞추며 생기는 것이라 알리지 않는다. */}
              {gaps[s.name] && (
                <span
                  data-gap={s.name}
                  title="줄 상자 안에서 글자의 위 여백, 아래 여백, 글자가 가운데에서 밀린 양(px)"
                  className={`w-48 shrink-0 text-right font-mono text-xs whitespace-nowrap tabular-nums ${
                    Math.abs(shiftOf(gaps[s.name])) > OFF ? 'text-danger' : 'text-ink-faint'
                  }`}
                >
                  {gapText(gaps[s.name])}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* 본문 크기로 쓴 문단. 줄 높이(좁게 · 보통 · 넓게)의 차이는 한 줄짜리 글이 아니라 줄과 줄 사이에서 보인다.
            높이는 가장 크고 넓게 골랐을 때의 세 줄에 맞춰 고정하고, 줄의 길이는 글자 수로 잡아서(em) 본문 크기를 바꿔도 같은 자리에서 줄이 바뀐다. */}
        <div data-paragraph className="mt-2 flex gap-3 rounded-md border border-hairline px-4 py-3">
          <span className="w-8 shrink-0 font-mono text-xs text-ink-faint">base</span>
          <span className="w-28 shrink-0 font-mono text-xs whitespace-nowrap text-ink-faint">
            {baseStep.size} / {baseStep.line}
          </span>
          <span className="w-28 shrink-0 text-xs whitespace-nowrap text-ink-soft">본문 문단</span>
          <span className="flex min-w-0 flex-1 items-start" style={{ height: PARAGRAPH_SLOT }}>
            <span className="line-clamp-3 max-w-[34em]" style={{ fontFamily: font, fontSize: baseStep.size, lineHeight: baseStep.line }}>
              {PARAGRAPH}
            </span>
          </span>
        </div>
        {/* 이 크기들이 실제로 들어가는 것들. 높이가 정해진 상자 안에 글이 놓이는 버튼, 칩, 뱃지, 입력칸은 위아래 가운데가 조금만 어긋나도 눈에 띈다.
            상자의 높이는 그 크기의 줄 높이에 위아래 여백을 더한 것이라, 줄 높이를 바꾸면 함께 바뀐다. */}
        <div data-examples className="mt-2 grid grid-cols-3 items-start gap-x-6 gap-y-3 rounded-md border border-hairline px-4 py-3">
          {EXAMPLES.map((ex) => {
            const step = steps.find((x) => x.name === ex.size)!
            const gap = gaps[`ex:${ex.id}`]
            return (
              <div key={ex.id}>
                {/* 상자가 놓이는 자리. 높이를 가장 큰 상자에 맞춰 고정해서, 고르는 동안 상자의 높이가 바뀌어도 창이 늘었다 줄었다 하지 않는다. */}
                <span className="flex items-center" style={{ height: EXAMPLE_SLOT }}>
                  <span
                    data-box
                    className={`inline-flex items-center ${ex.box}`}
                    style={{ fontFamily: font, fontSize: step.size, lineHeight: step.line, fontWeight: ex.weight, height: parseFloat(step.line) + ex.pad * 2 }}
                  >
                    {ex.icon && <CheckIcon size={16} strokeWidth={2} className="mr-1 shrink-0" />}
                    {/* 글자의 자리는 손대지 않는다. 컴포넌트로 내보낼 때와 같이 줄 상자를 상자 가운데에 놓을 뿐이라, 아래에 적는 숫자가 실제 결과물의 것이다. */}
                    <span data-ex={ex.id}>{ex.text}</span>
                  </span>
                </span>
                <p className="mt-2 text-xs text-ink-soft">
                  {ex.label} <span className="font-mono text-ink-faint">{ex.size}</span>
                </p>
                <p className={`font-mono text-xs whitespace-nowrap tabular-nums ${gap && Math.abs(shiftOf(gap)) > OFF ? 'text-danger' : 'text-ink-faint'}`}>
                  {gap ? gapText(gap) : '\u00a0'}
                </p>
                {/* 아이콘과 글자가 같은 높이에 있는지. 글자 모양의 가운데와 아이콘의 가운데가 위아래로 얼마나 벌어졌는지를 적는다. */}
                {gap?.icon !== undefined && (
                  <p data-icon-gap className={`font-mono text-xs whitespace-nowrap tabular-nums ${Math.abs(gap.icon) >= 1 ? 'text-danger' : 'text-ink-faint'}`}>
                    {Math.abs(gap.icon) < 0.05 ? '아이콘과 같은 높이' : `글자가 아이콘보다 ${Math.abs(gap.icon).toFixed(1)} ${gap.icon > 0 ? '아래' : '위'}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          {/* 이미 있는 단계가 새 값으로 바뀌는 것은 되돌리기 전에 알아야 하는 일이라 알린다. */}
          {replaced > 0 && <span className="mr-1 text-sm text-ink-faint">이미 있는 {replaced}개는 새 값으로 바뀌어요.</span>}
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="submit">
            만들기
          </Button>
        </div>
      </div>
    </form>
  )
}
