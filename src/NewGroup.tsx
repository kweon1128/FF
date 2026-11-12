import { useState, type FormEvent } from 'react'
import { SLUG } from './lib/catalog'
import { SCALE_STEPS, grayOf, nearestStep } from './lib/scale'
import { ColorSwatch } from './ColorPicker'
import { Button, Check, Field, inputClass } from './ui'

const HEX6 = /^#[0-9a-f]{6}$/i
const STEP = /^[a-z0-9]+$/
const DEFAULT_STEP = 500

/**
 * 새 색 목록을 만드는 양식. 목록 이름과 함께 첫 색의 단계와 색을 정한다.
 * 단계와 색은 빈 채로 시작한다. 비워 둔 칸에는 추천 값이 옅게 보이고, 그대로 만들면 추천 값이 쓰인다.
 * 추천 단계는 고른 색의 밝기에 가장 가까운 단계이고, 추천 색은 적은 단계의 밝기를 가진 회색이다.
 */
export function NewGroupForm({
  existing,
  group,
  onCreate,
  onCancel,
}: {
  existing: Set<string>
  /** 이미 있는 빈 목록에 첫 색을 넣을 때의 목록 이름. 주면 이름 칸 없이 단계와 색만 묻는다. */
  group?: string
  /** scale이 참이면 그 색을 기준으로 50~950의 나머지 단계도 함께 만든다. */
  onCreate: (name: string, step: string, color: string, scale: boolean) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(group ?? '')
  const [step, setStep] = useState('')
  const [color, setColor] = useState('')
  const [error, setError] = useState<{ name?: string; step?: string; color?: string }>({})
  // 목록을 만드는 가장 흔한 이유가 단계 한 벌을 만드는 것이라, 함께 만들기가 기본이다.
  const [scale, setScale] = useState(true)

  const typedColor = HEX6.test(color.trim()) ? color.trim().toLowerCase() : null
  // 색을 골랐으면 그 밝기에 맞는 단계를, 아니면 가운데 단계를 추천한다.
  const suggestedStep = String(typedColor ? nearestStep(typedColor) : DEFAULT_STEP)
  // 단계를 적었으면 그 단계 밝기의 회색을 추천한다. 50~950이 아닌 단계면 가운데 밝기의 회색.
  const suggestedColor = grayOf(Number(step.trim() || suggestedStep)) ?? grayOf(DEFAULT_STEP)!
  // 단계가 50~950 중 하나일 때만 나머지 단계를 함께 만들 수 있다.
  const canScale = SCALE_STEPS.includes(Number(step.trim() || suggestedStep))

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof error = {}
    const n = name.trim()
    if (group === undefined) {
      if (!n) next.name = '이름을 입력해 주세요.'
      else if (!SLUG.test(n)) next.name = '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
      else if (existing.has(n)) next.name = '같은 이름이 이미 있어요.'
    }
    if (step.trim() && !STEP.test(step.trim())) next.step = '영문 소문자와 숫자만 쓸 수 있어요.'
    if (color.trim() && !typedColor) next.color = '#rrggbb로 적어 주세요.'
    setError(next)
    // 비워 둔 칸은 추천 값으로 만든다.
    if (Object.keys(next).length === 0) onCreate(n, step.trim() || suggestedStep, typedColor ?? suggestedColor, scale && canScale)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {group === undefined && (
        <Field label="목록 이름" error={error.name}>
          <input
            autoFocus
            className={inputClass}
            value={name}
            placeholder="primary"
            onChange={(e) => {
              setName(e.target.value)
              setError({ ...error, name: undefined })
            }}
          />
        </Field>
      )}
      <div className="grid grid-cols-[96px_1fr] gap-2">
        <Field label="단계" error={error.step}>
          <input
            autoFocus={group !== undefined}
            className={inputClass}
            value={step}
            placeholder={suggestedStep}
            onChange={(e) => {
              setStep(e.target.value)
              setError({ ...error, step: undefined })
            }}
          />
        </Field>
        <Field label="색" error={error.color}>
          <span className="flex items-center gap-2">
            <ColorSwatch
              label="색 고르기"
              value={typedColor ?? suggestedColor}
              onChange={(hex) => {
                setColor(hex)
                setError({ ...error, color: undefined })
              }}
            />
            <input
              aria-label="색 값"
              className={`${inputClass} font-mono`}
              value={color}
              placeholder={suggestedColor}
              onChange={(e) => {
                setColor(e.target.value)
                setError({ ...error, color: undefined })
              }}
            />
          </span>
        </Field>
      </div>
      <Check checked={scale && canScale} disabled={!canScale} onChange={setScale}>
        50~950 단계 함께 만들기
      </Check>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          추가
        </Button>
      </div>
    </form>
  )
}
