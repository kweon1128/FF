import { ICON_STROKE } from './lib/icons'
import { useContext, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { PreviewFontContext, PreviewSpace } from './ColorUses'
import { shownWeight } from './NewFont'
import { parseFontValue, shownFont, weightsOf } from './lib/fonts'
import { WEIGHT_SETS, type WeightRole, type WeightStep } from './lib/presets'
import { SetNotice, StepName, nameProblem } from './StepName'
import { useUndo } from './lib/useUndo'
import { PlainScreen } from './TypeScreen'
import { Button } from './ui'

const LABEL = 'mb-label type-label text-ink-faint'
const STEP_BUTTON =
  'flex size-icon-button shrink-0 items-center justify-center rounded-control text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-focus disabled:opacity-disabled disabled:hover:bg-transparent'
/** 처음에 고르는 단계 수. 셋(본문, 중간, 굵게)이다. */
const COUNT_START = 3

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
  // 받을 수 없는 값(100 미만, 900 초과)을 적는 동안은 칸을 빨갛게 한다. 글자 크기 창의 칸들과 같다.
  const bad = !!draft && (Number(draft) < WEIGHT_MIN || Number(draft) > WEIGHT_MAX)
  return (
    <input
      aria-label={`${name} 굵기`}
      aria-invalid={bad || undefined}
      inputMode="numeric"
      title={custom === null ? '숫자를 고치면 이 단계의 굵기를 직접 정해요' : `직접 정한 굵기예요. 비우면 정해 둔 값(${rule})으로 돌아가요`}
      className={`h-compact w-[48px] shrink-0 rounded-small border-edge bg-canvas text-center ${bad ? 'border-danger' : 'border-hairline hover:border-ink-faint focus:border-selection'} type-code-sm outline-none placeholder:text-ink-faint/50 ${
        custom !== null ? 'text-ink' : 'text-ink-soft'
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
  users = {},
  fonts = [],
  onCreate,
  onCancel,
}: {
  /** 이미 있는 굵기의 이름들. 같은 이름은 새 값으로 바뀌고, 새 한 벌에 없는 이름은 지워진다. */
  existing: Set<string>
  /** 이미 있는 굵기마다 그것을 쓰는 곳들(의미 글꼴, 컴포넌트). 쓰이는 값이 지워질 때 알린다. */
  users?: Record<string, string[]>
  /** 이 시스템의 글꼴 종류들(이름과 값). 견본을 어느 글꼴로 그릴지 고른다. */
  fonts?: { name: string; value: string }[]
  onCreate: (steps: { name: string; value: string }[]) => void
  onCancel: () => void
}) {
  const firstFont = useContext(PreviewFontContext)
  const [fontName, setFontName] = useState(fonts[0]?.name ?? null)
  const font = fonts.find((f) => f.name === fontName)?.value ?? firstFont ?? 'system-ui, sans-serif'
  // 몇 단계로 할지. 처음에는 셋(본문, 중간, 굵게)이다.
  const [count, setCount] = useState(COUNT_START)
  // 정해 둔 값 대신 직접 적은 굵기. 단계의 이름으로 찾는다.
  const [custom, setCustom] = useState<Record<string, number>>({})
  const counts = WEIGHT_SETS.map((s) => s.count)
  // 단계 수를 바꾸면 직접 적은 굵기를 지운다. 글자 크기 한 벌 만들기와 같다. 한 벌의 틀을 바꾸면 처음부터 다시 정한다.
  const changeCount = (next: number) => {
    setCount(next)
    setCustom({})
  }
  // 마우스를 올린 단계. 표의 줄과 화면 예시의 글자를 서로 짚어 준다.
  const [hot, setHot] = useState<string | null>(null)
  const ruled = WEIGHT_SETS.find((s) => s.count === count)!.steps
  const steps: WeightStep[] = ruled.map((s) => ({ ...s, weight: custom[s.name] ?? s.weight }))
  // 단계의 이름을 직접 고친 것. 원래 이름으로 찾는다.
  const [names, setNames] = useState<Record<string, string>>({})
  const nameOf = (name: string) => names[name] ?? name
  const problem = nameProblem(steps.map((s) => nameOf(s.name)))

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
  const type = { fontFamily: font, fontSize: 16, lineHeight: '24px' }

  // 창 안에서 고르고 고친 것을 Ctrl+Z로 되돌리고 Ctrl+Shift+Z로 다시 실행한다.
  useUndo({ count, custom, names, fontName }, (s) => {
    setCount(s.count)
    setCustom(s.custom)
    setNames(s.names)
    setFontName(s.fontName)
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (problem) return
    onCreate(steps.map((s) => ({ name: nameOf(s.name), value: String(s.weight) })))
  }

  // 처음 열었을 때와 달라진 것이 있는지. 견본의 글꼴은 보기만 바꾸는 것이라 세지 않는다.
  const changed = count !== COUNT_START || Object.keys(custom).length > 0 || Object.entries(names).some(([from, to]) => from !== to)
  /** 단계 수와 직접 고친 값(굵기, 이름)을 모두 처음으로 돌린다. 견본의 글꼴은 그대로 둔다. */
  function reset() {
    setCount(COUNT_START)
    setCustom({})
    setNames({})
  }

  // 화면 예시의 자리마다의 글자 모습. 크기는 이 창에서 정하는 것이 아니라서 흔히 쓰는 값으로 두고, 굵기만 그 쓰임을 맡은 단계의 것으로 그린다.
  // 자리마다 어느 단계의 굵기로 그렸는지도 함께 적어 둔다(groups). 표의 줄과 화면의 글자를 서로 짚어 주는 데 쓴다.
  const groups: Record<string, string> = {}
  const at = (size: number, line: number, role: WeightRole) => ({ size, line, role })
  const places = {
    overline: at(13, 20, 'label'),
    caption: at(13, 20, 'body'),
    display: at(33, 42, 'heading'),
    'title-lg': at(28, 36, 'heading'),
    'title-md': at(23, 32, 'heading'),
    'title-sm': at(19, 28, 'heading'),
    'body-lg': at(19, 28, 'body'),
    body: at(16, 24, 'body'),
    'body-strong': at(16, 24, 'strong'),
    numeric: at(19, 28, 'strong'),
    'body-sm': at(14, 20, 'body'),
    code: at(14, 20, 'body'),
    tab: at(14, 20, 'body'),
    'tab-on': at(14, 20, 'selected'),
    'button-sm': at(13, 20, 'button'),
    button: at(14, 20, 'button'),
    label: at(14, 20, 'label'),
    'button-lg': at(16, 24, 'button'),
    quote: at(19, 28, 'body'),
  }
  const looks = Object.fromEntries(
    Object.entries(places).map(([use, { size, line, role }]) => {
      const step = steps.find((s) => s.roles.includes(role))
      if (step) groups[use] = step.name
      return [use, { fontFamily: font, fontSize: size, lineHeight: `${line}px`, fontWeight: step?.weight ?? 400 }]
    }),
  )

  return (
    // 아래의 버튼 줄은 두 열 아래에 창의 폭을 다 써서 놓인다. 다른 창들처럼 "원래대로"가 창의 왼쪽 끝에 온다.
    <form onSubmit={submit}>
      <div className="flex gap-groups">
      <div className="w-dialog-side shrink-0 space-y-settings">
        <div>
          <p className={LABEL}>단계 수</p>
          {/* 글자 크기 한 벌 만들기의 단계 수와 같은 모양이다. -, +로 2단계에서 4단계까지 고른다. */}
          <span className="flex h-control items-center gap-actions-tight">
            <button type="button" aria-label="단계 줄이기" disabled={count <= Math.min(...counts)} onClick={() => changeCount(count - 1)} className={STEP_BUTTON}>
              <Minus size={16} strokeWidth={ICON_STROKE} />
            </button>
            <span data-count className="w-stepper-value text-center type-body tabular-nums!">
              {count}단계
            </span>
            <button type="button" aria-label="단계 늘리기" disabled={count >= Math.max(...counts)} onClick={() => changeCount(count + 1)} className={STEP_BUTTON}>
              <Plus size={16} strokeWidth={ICON_STROKE} />
            </button>
          </span>
        </div>
        {/* 위의 것은 만들어지는 값을 정하고, 이것은 보기만 바꾼다. 그래서 구분선 아래에 둔다.
            굵기는 글꼴마다 가진 것이 달라서, 글꼴을 바꾸면 "실제로 그려지는 굵기"가 달라진다. */}
        {fonts.length > 0 && (
          <div className="border-t-divider border-hairline pt-settings">
            <p className={LABEL}>견본의 글꼴</p>
            {fonts.length === 1 ? (
              <p className="type-body">
                <span className="type-code text-ink-faint">{fonts[0].name}</span> {shownFont(fonts[0].value)}
              </p>
            ) : (
              <div role="radiogroup" aria-label="견본의 글꼴" className="space-y-rows">
                {fonts.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    role="radio"
                    aria-checked={f.name === fontName}
                    onClick={() => setFontName(f.name)}
                    className={`flex h-row w-full items-center gap-row-inner rounded-row px-row-x text-left type-body outline-selection focus-visible:outline-focus ${
                      f.name === fontName ? 'bg-selection-soft' : 'hover:bg-hover'
                    }`}
                  >
                    <span className="shrink-0 type-code-sm text-ink-faint">{f.name}</span>
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
        <div data-weights className="h-[164px] space-y-rows rounded-card border-edge border-hairline px-section-x py-section-y">
          {steps.map((s) => {
            const real = drawn[s.name]
            return (
              <div key={s.name} data-step={s.name} onMouseEnter={() => setHot(s.name)} onMouseLeave={() => setHot(null)} className="flex h-row items-center gap-cells">
                {/* 마우스를 올렸을 때의 회색 바탕은 이름, 값, 쓰이는 곳까지만 덮는다. 견본 문장은 바탕 밖에 두고 화면 예시의 글자처럼 1px 선을 둘러 표시한다(글자 크기 한 벌 만들기와 같다).
                    바탕의 좌우 여백은 그 끝에 놓인 것의 위아래 여백과 같게 한다. 왼쪽 끝은 이름 칸(24px, 위아래 4px)이라 4px, 오른쪽 끝은 쓰이는 곳의 글자(줄 높이 16px, 위아래 8px)라 8px. */}
                <span className={`-ml-chip-x flex h-row shrink-0 items-center gap-cells rounded-row pr-row-x pl-chip-x ${hot === s.name ? 'bg-hover' : ''}`}>
                  <StepName wide label={`${s.name} 이름`} value={nameOf(s.name)} onChange={(name) => setNames({ ...names, [s.name]: name })} />
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
                  <span data-use className="w-[144px] shrink-0 type-caption whitespace-nowrap text-ink-soft">
                    {s.use}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span data-line={s.name} className={`block w-fit max-w-full truncate rounded-small outline-offset-2 outline-selection ${hot === s.name ? 'outline-mark' : ''}`} style={{ ...type, fontWeight: s.weight }}>
                    {LINE}
                  </span>
                </span>
                {/* 이 글꼴에 그 굵기가 없으면 다른 굵기로 그려진다. 그러면 단계를 나눈 뜻이 없어지므로 알린다. */}
                <span data-drawn={s.name} className={`w-[176px] shrink-0 text-right type-caption whitespace-nowrap ${real !== s.weight ? 'text-danger' : 'text-ink-faint'}`}>
                  {real !== s.weight ? `이 글꼴에서는 ${real}으로 그려져요` : ''}
                </span>
              </div>
            )
          })}
        </div>
        {/* 이 굵기들이 실제 화면에 놓인 모습. 쓰임마다 맡은 단계의 굵기로 그린다. 굵기는 혼자가 아니라 옆의 글과 함께 놓였을 때 판단할 수 있다.
            이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. */}
        <div data-uses className="mt-blocks rounded-card border-edge border-hairline bg-canvas p-board text-ink">
          <PreviewSpace>
            <PlainScreen short looks={looks} groups={groups} hot={hot} onHot={setHot} />
          </PreviewSpace>
        </div>
      </div>
      </div>
        <div className="mt-dialog-actions flex items-center justify-end gap-actions">
          {/* 바꾼 것을 모두 처음으로 돌린다. 글자 크기 한 벌 만들기와 같은 자리다. 바꾼 것이 없으면 꺼져 있다. */}
          <Button variant="ghost" className="mr-auto" disabled={!changed} title="단계 수와 직접 고친 값을 모두 처음으로 돌려요" onClick={reset}>
            <RotateCcw size={16} strokeWidth={ICON_STROKE} />
            원래대로
          </Button>
          {/* 이미 있는 단계가 새 값으로 바뀌는 것은 되돌리기 전에 알아야 하는 일이라 알린다. */}
          {problem ? (
            <span role="alert" className="mr-actions-tight type-body text-danger">
              {problem}
            </span>
          ) : (
            <SetNotice made={steps.map((s) => nameOf(s.name))} existing={[...existing]} users={users} />
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
