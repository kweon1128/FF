import { useContext, useEffect, useMemo, useState, type FormEvent } from 'react'
import { PreviewFontContext } from './ColorUses'
import { shownWeight } from './NewFont'
import { parseFontValue, shownFont, weightsOf } from './lib/fonts'
import { WEIGHT_SETS, type WeightRole, type WeightStep } from './lib/presets'
import { Button } from './ui'

const LABEL = 'mb-1 text-sm font-[550] text-ink-faint'
const SEGMENT = 'h-6 rounded-sm text-sm outline-selection focus-visible:outline-2'
const SEGMENT_ON = 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]'
const SEGMENT_OFF = 'text-ink-soft hover:text-ink'

/** 굵기로 적을 수 있는 범위. CSS의 굵기는 1부터 1000까지지만, 글꼴이 실제로 갖는 것은 100부터 900 사이다. */
const WEIGHT_MIN = 100
const WEIGHT_MAX = 900
/** 굵기를 견줄 때 쓰는 글. 단계마다 같은 글을 위아래로 붙여 놓아야 차이가 보인다. */
const LINE = '비밀번호를 바꿨어요 Password 123'
const INK = '가나다라마바사'

let pen: CanvasRenderingContext2D | null | undefined
/** 그 글꼴과 굵기로 쓴 글의 폭(100px 크기). 굵기가 실제로 달라지면 폭도 달라진다. */
function widthAt(family: string, weight: number) {
  if (pen === undefined) pen = document.createElement('canvas').getContext('2d')
  if (!pen) return 0
  pen.font = `${weight} 100px ${family}`
  return pen.measureText(INK + 'Password').width
}

/**
 * 그 글꼴에서 그 굵기를 청했을 때 실제로 그려지는 굵기.
 * 가변 글꼴은 550 같은 사이 값도 그대로 그린다. 굵기가 몇 개로 정해진 글꼴은 가장 가까운 것으로 대신 그린다(브라우저의 규칙).
 * 가변인지는 그려 보고 가린다. 450으로 쓴 글의 폭이 400과도 500과도 다르면 사이 값을 그릴 수 있는 글꼴이다.
 */
function drawnWeight(value: string, want: number) {
  const family = value
  const mid = widthAt(family, 450)
  const variable = Math.abs(mid - widthAt(family, 400)) > 0.01 && Math.abs(mid - widthAt(family, 500)) > 0.01
  if (variable) return want
  return shownWeight(weightsOf(parseFontValue(value).font), want)
}

/** 견본의 한 줄에서 그 단계의 굵기를 고치는 칸. 숫자만 적는다. 직접 정한 값은 진하고 굵게 보이고, 비우면 정해 둔 값으로 돌아간다. */
function StepWeight({ name, rule, custom, onChange }: { name: string; rule: number; custom: number | null; onChange: (weight: number | null) => void }) {
  // 적는 중인 글자. 5를 거쳐 550을 적는 동안처럼 아직 값이 되지 못한 것도 칸에는 그대로 보여야 한다.
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      aria-label={`${name} 굵기`}
      inputMode="numeric"
      title={custom === null ? '숫자를 고치면 이 단계의 굵기를 직접 정해요' : `직접 정한 굵기예요. 비우면 정해 둔 값(${rule})으로 돌아가요`}
      className={`h-6 w-12 rounded-sm border border-hairline bg-canvas text-center font-mono text-xs outline-none focus:border-selection ${
        custom !== null ? 'font-bold text-ink' : 'text-ink-soft'
      }`}
      value={draft ?? String(custom ?? rule)}
      placeholder={String(rule)}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
        setDraft(digits)
        if (!digits) return onChange(null)
        const weight = Number(digits)
        if (weight >= WEIGHT_MIN && weight <= WEIGHT_MAX) onChange(weight === rule ? null : weight)
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

/**
 * 굵기 한 벌을 만드는 양식. 굵기도 낱개가 아니라 한 벌이다. 본문은 얼마, 강조와 버튼은 얼마, 제목은 얼마로 정한다.
 * 굵기는 옆에 있는 것과의 차이가 전부라서, 같은 글을 단계마다 위아래로 붙여 놓고 견준다.
 * 그 굵기가 견본의 글꼴에 실제로 있는지도 함께 알린다. 없는 굵기는 가까운 것으로 뭉개져 단계가 구분되지 않는다.
 */
export function NewWeightsForm({
  existing,
  fonts = [],
  onCreate,
  onCancel,
}: {
  /** 이미 있는 굵기의 이름들. 같은 이름은 새 값으로 바뀐다. */
  existing: Set<string>
  /** 이 시스템의 글꼴 종류들(이름과 값). 견본을 어느 글꼴로 그릴지 고른다. */
  fonts?: { name: string; value: string }[]
  onCreate: (steps: { name: string; value: string }[]) => void
  onCancel: () => void
}) {
  const firstFont = useContext(PreviewFontContext)
  const [fontName, setFontName] = useState(fonts[0]?.name ?? null)
  const font = fonts.find((f) => f.name === fontName)?.value ?? firstFont ?? 'system-ui, sans-serif'
  // 몇 단계로 할지. 처음에는 셋(본문, 중간, 굵게)이다.
  const [count, setCount] = useState(3)
  // 정해 둔 값 대신 직접 적은 굵기. 단계의 이름으로 찾는다. 단계 수를 바꿔도 같은 이름의 것은 남는다.
  const [custom, setCustom] = useState<Record<string, number>>({})
  const ruled = WEIGHT_SETS.find((s) => s.count === count)!.steps
  const steps: WeightStep[] = ruled.map((s) => ({ ...s, weight: custom[s.name] ?? s.weight }))
  const replaced = steps.filter((s) => existing.has(s.name)).length

  // 글꼴이 불려 온 뒤에 다시 잰다. 불려 오기 전에는 대체 글꼴로 재게 된다.
  const [loaded, setLoaded] = useState(0)
  const wanted = steps.map((s) => s.weight).join(',')
  useEffect(() => {
    let alive = true
    Promise.all([400, 450, 500, ...wanted.split(',').map(Number)].map((w) => document.fonts.load(`${w} 16px ${font}`, INK + LINE)))
      .then(() => alive && setLoaded((n) => n + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [font, wanted])
  // 단계마다 이 글꼴에서 실제로 그려지는 굵기.
  const drawn = useMemo(
    () => Object.fromEntries(steps.map((s) => [s.name, drawnWeight(font, s.weight)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [font, wanted, loaded],
  )
  /** 그 쓰임을 맡은 단계의 굵기. 쓰임마다 단계가 하나씩 정해져 있다. */
  const of = (role: WeightRole) => steps.find((s) => s.roles.includes(role))?.weight ?? 400
  const type = { fontFamily: font, fontSize: 16, lineHeight: '24px' }

  function submit(e: FormEvent) {
    e.preventDefault()
    onCreate(steps.map((s) => ({ name: s.name, value: String(s.weight) })))
  }

  return (
    <form onSubmit={submit} className="flex gap-6">
      <div className="w-56 shrink-0 space-y-4">
        <div>
          <p className={LABEL}>단계 수</p>
          <div role="radiogroup" aria-label="단계 수" className="grid grid-cols-3 gap-1 rounded-md bg-hover p-1">
            {WEIGHT_SETS.map((s) => (
              <button key={s.count} type="button" role="radio" aria-checked={s.count === count} onClick={() => setCount(s.count)} className={`${SEGMENT} ${s.count === count ? SEGMENT_ON : SEGMENT_OFF}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {/* 위의 것은 만들어지는 값을 정하고, 이것은 보기만 바꾼다. 그래서 구분선 아래에 둔다.
            굵기는 글꼴마다 가진 것이 달라서, 글꼴을 바꾸면 "실제로 그려지는 굵기"가 달라진다. */}
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
        {/* 얇은 것부터 굵은 것 순서로, 한 줄에 한 단계. 같은 글을 위아래로 붙여 놓아 단계 사이의 차이를 바로 본다.
            높이는 네 단계일 때에 맞춰 고정해서 단계 수를 바꿔도 창이 늘었다 줄었다 하지 않는다. */}
        <div data-weights className="h-[140px] space-y-1 rounded-md border border-hairline px-4 py-3">
          {steps.map((s) => {
            const real = drawn[s.name]
            return (
              <div key={s.name} data-step={s.name} className="flex h-6 items-center gap-3">
                <span className="w-16 shrink-0 font-mono text-xs text-ink-faint">{s.name}</span>
                <StepWeight
                  name={s.name}
                  rule={ruled.find((r) => r.name === s.name)!.weight}
                  custom={custom[s.name] ?? null}
                  onChange={(weight) =>
                    setCustom((now) => {
                      const { [s.name]: _gone, ...rest } = now
                      return weight === null ? rest : { ...rest, [s.name]: weight }
                    })
                  }
                />
                {/* 이 굵기가 흔히 쓰이는 곳. */}
                <span data-use className="w-36 shrink-0 text-xs whitespace-nowrap text-ink-soft">
                  {s.use}
                </span>
                <span data-line={s.name} className="min-w-0 flex-1 whitespace-nowrap" style={{ ...type, fontWeight: s.weight }}>
                  {LINE}
                </span>
                {/* 이 글꼴에 그 굵기가 없으면 다른 굵기로 그려진다. 그러면 단계를 나눈 뜻이 없어지므로 알린다. */}
                <span data-drawn={s.name} className={`w-44 shrink-0 text-right text-xs whitespace-nowrap ${real !== s.weight ? 'text-danger' : 'text-ink-faint'}`}>
                  {real !== s.weight ? `이 글꼴에서는 ${real}으로 그려져요` : ''}
                </span>
              </div>
            )
          })}
        </div>
        {/* 이 굵기들이 실제로 쓰이는 모습. 쓰임마다 맡은 단계의 굵기로 그린다. 굵기는 혼자가 아니라 옆의 글과 함께 놓였을 때 판단할 수 있다. */}
        <div data-uses className="mt-2 grid grid-cols-[1.4fr_1fr] gap-x-8 gap-y-4 rounded-md border border-hairline px-4 py-4" style={{ fontFamily: font }}>
          <div>
            <p data-role="heading" className="text-xl leading-7" style={{ fontWeight: of('heading') }}>
              비밀번호 바꾸기
            </p>
            <p className="mt-2" style={{ ...type, fontWeight: of('body') }}>
              영문과 숫자를 섞어{' '}
              <span data-role="strong" style={{ fontWeight: of('strong') }}>
                8자 이상
              </span>
              으로 정해 주세요. 다른 서비스에서 쓰는 비밀번호와 같으면 한 곳에서 새어 나갔을 때 여기까지 위험해집니다.
            </p>
            <p className="mt-3 flex gap-2">
              <span data-role="button" className="inline-flex h-9 items-center rounded-md bg-ink px-3 text-sm text-white" style={{ fontWeight: of('button') }}>
                저장하기
              </span>
              <span className="inline-flex h-9 items-center rounded-md border border-hairline px-3 text-sm" style={{ fontWeight: of('button') }}>
                취소
              </span>
            </p>
          </div>
          <div>
            <p data-role="label" className="text-xs leading-4 text-ink-soft" style={{ fontWeight: of('label') }}>
              설정
            </p>
            {/* 선택된 메뉴 항목은 굵기로도 구분한다. 줄마다 바탕이 생기므로 4px 띄운다. */}
            <div className="mt-1 space-y-1 text-sm">
              {['프로필', '계정과 보안', '알림'].map((item, i) => (
                <p key={item} data-role={i === 1 ? 'selected' : undefined} className={`flex h-8 items-center rounded-md px-2 ${i === 1 ? 'bg-hover' : 'text-ink-soft'}`} style={{ fontWeight: i === 1 ? of('selected') : of('body') }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
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
