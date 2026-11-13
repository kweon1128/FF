import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check as CheckIcon, Minus, Plus } from 'lucide-react'
import { PreviewFontContext } from './ColorUses'
import { shownFont } from './lib/fonts'
import { BASE_MAX, BASE_MIN, LEADINGS, SPREADS, lineFor, sizeScale, type Leading, type Spread } from './lib/presets'
import { Button, Check } from './ui'

/** 위아래 여백을 잴 때 기준으로 삼는 글자. 받침이 없는 글자와 있는 글자가 섞여 한글의 평균적인 높이를 낸다. */
const INK = '가나다라마바사'
/** 위아래 여백의 차이가 이보다 크면(px) 눈에 띄게 치우친 것으로 보고 색으로 알린다. */
const OFF = 1.5
/** 견본에서 그 단계를 그리는 굵기. 본문보다 큰 단계는 제목이라 굵게 쓴다. */
const weightOf = (name: string) => (name === 'base' || name === 'sm' || name === 'xs' ? 400 : 700)

/**
 * 그 글꼴, 굵기, 크기, 줄 높이로 한 줄을 그렸을 때 줄 상자 안에서 한글의 위 여백과 아래 여백(px).
 * 화면 밖에 잠깐 그려서 실제 자리를 잰다. 브라우저가 글자의 기준선을 픽셀에 맞추는 방식까지 그대로 반영된다.
 */
function gapAt(font: string | undefined, weight: number, size: number, line: number) {
  const pen = document.createElement('canvas').getContext('2d')
  const el = document.createElement('span')
  el.style.cssText = `position:absolute;left:-9999px;top:0;display:block;white-space:nowrap;font-weight:${weight};font-size:${size}px;line-height:${line}px`
  if (font) el.style.fontFamily = font
  el.textContent = INK
  const probe = document.createElement('span')
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  el.appendChild(probe)
  document.body.appendChild(el)
  const baseline = probe.getBoundingClientRect().top
  const rect = el.getBoundingClientRect()
  const family = getComputedStyle(el).fontFamily
  el.remove()
  if (!pen) return { top: 0, bottom: 0 }
  pen.font = `${weight} 100px ${family}`
  const ink = pen.measureText(INK)
  const k = size / 100
  return { top: baseline - ink.actualBoundingBoxAscent * k - rect.top, bottom: rect.bottom - (baseline + ink.actualBoundingBoxDescent * k) }
}

const LABEL = 'mb-1 text-sm font-[550] text-ink-faint'
const STEP_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:opacity-40 disabled:hover:bg-transparent'

/**
 * 크기가 실제로 들어가는 것들의 예시. size는 쓰는 글자 크기, pad는 줄 높이 위아래에 더하는 여백(px), box는 상자의 모양.
 * 모두 높이가 정해진 상자 안에 글이 놓이는 것들이라 위아래 가운데가 중요하다.
 */
const EXAMPLES: { id: string; label: string; size: string; weight: number; pad: number; box: string; text: string; icon?: boolean }[] = [
  { id: 'button', label: '버튼', size: 'sm', weight: 600, pad: 6, box: 'rounded-md bg-ink px-3 text-white', text: '저장하기' },
  { id: 'button-lg', label: '큰 버튼', size: 'base', weight: 600, pad: 8, box: 'rounded-md bg-ink px-4 text-white', text: '시작하기' },
  { id: 'button-icon', label: '아이콘 버튼', size: 'sm', weight: 600, pad: 6, box: 'rounded-md border border-hairline px-3', text: '완료', icon: true },
  { id: 'input', label: '입력칸', size: 'sm', weight: 400, pad: 8, box: 'w-40 rounded-md border border-hairline px-2.5 text-ink-faint', text: '이메일 주소' },
  { id: 'chip', label: '칩', size: 'xs', weight: 500, pad: 4, box: 'rounded-full bg-hover px-2.5', text: '디자인' },
  { id: 'badge', label: '뱃지', size: 'xs', weight: 700, pad: 1, box: 'rounded-sm bg-selection px-1.5 text-white', text: '필수' },
]

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
  // 홀수 px의 글자 크기를 쓸지. 끄면 모든 단계를 짝수로 맞춘다.
  const [odd, setOdd] = useState(true)
  // 위아래 여백의 차이가 가장 작은 크기로 다듬을지.
  const [fit, setFit] = useState(false)
  // 글꼴이 불려 온 뒤에 다시 잰다.
  const [loaded, setLoaded] = useState(0)
  const steps = useMemo(() => {
    const raw = sizeScale(base, spread, leading, odd)
    if (!fit) return raw
    // 단계마다 한 칸 작은 크기, 그 크기, 한 칸 큰 크기를 실제로 그려 보고, 글자가 줄 가운데에 가장 가깝게 앉는 것을 고른다.
    // 한 칸은 홀수를 쓰면 1px, 짝수만 쓰면 2px이다. 본문 크기는 고른 그대로 두고, 단계의 순서가 뒤집히지 않는 범위에서만 바꾼다.
    const px = raw.map((s) => parseFloat(s.size))
    const jump = odd ? 1 : 2
    const tuned = [...px]
    for (let i = 0; i < px.length; i++) {
      if (raw[i].name === 'base') continue
      const low = i === 0 ? 8 : tuned[i - 1] + 1
      const high = i === px.length - 1 ? Infinity : px[i + 1] - 1
      let best = px[i]
      let bestOff = Infinity
      // 원래 크기를 먼저 재서, 차이가 같으면 원래 크기가 남게 한다.
      for (const size of [px[i], px[i] - jump, px[i] + jump]) {
        if (size < low || size > high) continue
        const gap = gapAt(font, weightOf(raw[i].name), size, lineFor(size, leading))
        const off = Math.abs(gap.top - gap.bottom)
        if (off < bestOff - 0.05) {
          best = size
          bestOff = off
        }
      }
      tuned[i] = best
    }
    return raw.map((s, i) => ({ name: s.name, size: `${tuned[i]}px`, line: `${lineFor(tuned[i], leading)}px` }))
    // loaded: 글꼴이 불려 오면 글자의 자리가 달라지므로 다시 고른다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, spread, leading, odd, fit, font, loaded])
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
          <div role="radiogroup" aria-label="단계 사이" className="grid grid-cols-3 gap-0.5 rounded-md bg-hover p-0.5">
            {SPREADS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === spread}
                onClick={() => setSpread(s.id)}
                className={`h-7 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
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
          <div role="radiogroup" aria-label="줄 높이" className="grid grid-cols-3 gap-0.5 rounded-md bg-hover p-0.5">
            {LEADINGS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={l.id === leading}
                onClick={() => setLeading(l.id)}
                className={`h-7 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
                  l.id === leading ? 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        {/* 크기를 맞추는 방식 둘. */}
        <div className="space-y-2 text-sm">
          <Check checked={odd} onChange={setOdd}>
            홀수 크기도 쓰기
          </Check>
          <Check checked={fit} onChange={setFit}>
            위아래 차이가 작은 크기로 다듬기
          </Check>
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
              <span className="w-20 shrink-0 font-mono text-xs whitespace-nowrap text-ink-faint">
                {s.size} / {s.line}
              </span>
              {/* 이 크기가 흔히 쓰이는 곳. */}
              <span data-use className="w-28 shrink-0 text-xs whitespace-nowrap text-ink-soft">{SAMPLES[s.name].use}</span>
              {/* 글의 뒤에 바탕(선택 색 35%)을 깔아 줄 높이를 보여 준다. 옅으면 흰 바탕과 구분이 안 되어 줄 상자의 위아래 끝이 보이지 않는다. 바탕의 높이가 곧 줄 높이이고, 글자가 그 안에서 위아래 가운데에 오는지를 눈으로 본다.
                  글자의 자리는 손대지 않고 글꼴이 정한 그대로 둔다. 실제 화면에서도 이렇게 놓인다. */}
              <span className="min-w-0 flex-1">
                <span
                  data-line={s.name}
                  className="block w-fit max-w-full truncate bg-selection/35"
                  style={{ fontFamily: font, fontSize: s.size, lineHeight: s.line, fontWeight: s.name === 'base' || s.name === 'sm' || s.name === 'xs' ? 400 : 700 }}
                >
                  {SAMPLES[s.name].text}
                </span>
              </span>
              {/* 줄 상자 안에서 글자의 위 여백과 아래 여백. 둘이 같으면 한가운데다. 차이가 크면 그 글꼴은 이 줄 높이에서 치우쳐 보인다. */}
              {gaps[s.name] && (
                <span
                  data-gap={s.name}
                  title="줄 상자 안에서 글자의 위 여백, 아래 여백, 둘의 차이(px)"
                  className={`w-48 shrink-0 text-right font-mono text-xs whitespace-nowrap tabular-nums ${
                    Math.abs(gaps[s.name].top - gaps[s.name].bottom) >= OFF ? 'text-danger' : 'text-ink-faint'
                  }`}
                >
                  위 {gaps[s.name].top.toFixed(1)} · 아래 {gaps[s.name].bottom.toFixed(1)} · 차이 {Math.abs(gaps[s.name].top - gaps[s.name].bottom).toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* 이 크기들이 실제로 들어가는 것들. 높이가 정해진 상자 안에 글이 놓이는 버튼, 칩, 뱃지, 입력칸은 위아래 가운데가 조금만 어긋나도 눈에 띈다.
            상자의 높이는 그 크기의 줄 높이에 위아래 여백을 더한 것이라, 줄 높이를 바꾸면 함께 바뀐다. 글자의 자리는 글꼴이 정한 그대로다. */}
        <div data-examples className="mt-2 grid grid-cols-3 items-start gap-x-6 gap-y-3 rounded-md border border-hairline px-4 py-3">
          {EXAMPLES.map((ex) => {
            const step = steps.find((x) => x.name === ex.size)!
            const gap = gaps[`ex:${ex.id}`]
            return (
              <div key={ex.id}>
                <span
                  data-box
                  className={`inline-flex items-center ${ex.box}`}
                  style={{ fontFamily: font, fontSize: step.size, lineHeight: step.line, fontWeight: ex.weight, height: parseFloat(step.line) + ex.pad * 2 }}
                >
                  {ex.icon && <CheckIcon size={16} strokeWidth={2} className="mr-1.5 shrink-0" />}
                  <span data-ex={ex.id}>{ex.text}</span>
                </span>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {ex.label} <span className="font-mono text-ink-faint">{ex.size}</span>
                </p>
                <p className={`font-mono text-xs whitespace-nowrap tabular-nums ${gap && Math.abs(gap.top - gap.bottom) >= OFF ? 'text-danger' : 'text-ink-faint'}`}>
                  {gap ? `위 ${gap.top.toFixed(1)} · 아래 ${gap.bottom.toFixed(1)} · 차이 ${Math.abs(gap.top - gap.bottom).toFixed(1)}` : '\u00a0'}
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
