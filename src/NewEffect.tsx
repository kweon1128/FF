import { useState, type FormEvent } from 'react'
import { SLUG, type Kind } from './lib/catalog'
import { EFFECT_PRESETS, EFFECT_SHAPES, writeEffectNote, type EffectKind, type EffectShape } from './lib/effects'
import { Button, Field, UsePicker, inputClass } from './ui'

/**
 * 효과(그림자, 투명도, 흐림)를 만드는 양식. 쓰임을 고르면 그 쓰임의 이름과 추천 값, 설명, 예시 모양으로 만든다.
 * 효과는 단계가 아니라 쓰임으로 이름 붙이므로, 무엇에 쓸지를 먼저 묻는다. 값은 만든 뒤에 패널에서 고친다.
 */
export function NewEffectForm({
  kind,
  existing,
  onCreate,
  onCancel,
}: {
  kind: Kind
  /** 이 종류에 이미 있는 이름들(앞머리를 뺀 것). */
  existing: Set<string>
  onCreate: (name: string, value: string, note: string) => void
  onCancel: () => void
}) {
  const id = kind.id as EffectKind
  const shapes = EFFECT_SHAPES.filter((s) => s.kind === id)
  // 아직 만들지 않은 쓰임을 먼저 골라 둔다. 다 있으면 첫 쓰임.
  const first = shapes.find((s) => !existing.has(EFFECT_PRESETS[s.id].name)) ?? shapes[0]
  const free = (shape: EffectShape) => (existing.has(EFFECT_PRESETS[shape].name) ? '' : EFFECT_PRESETS[shape].name)
  const [shape, setShape] = useState<EffectShape>(first.id)
  const [name, setName] = useState(free(first.id))
  // 이름을 직접 고치기 전까지는 고른 쓰임의 이름을 따라간다.
  const [typed, setTyped] = useState(false)
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const problem = !n ? '이름을 입력해 주세요.' : !SLUG.test(n) ? '영문 소문자, 숫자, 하이픈만 쓸 수 있어요.' : existing.has(n) ? '같은 이름이 이미 있어요.' : undefined
    setError(problem)
    if (problem) return
    const preset = EFFECT_PRESETS[shape]
    onCreate(kind.prefix + n, preset.value, writeEffectNote(id, preset.text, shape))
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="쓰임">
        <UsePicker
          label="쓰임"
          options={shapes}
          value={shape}
          onChange={(next) => {
            setShape(next)
            if (!typed) {
              setName(free(next))
              setError(undefined)
            }
          }}
        />
      </Field>
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder={EFFECT_PRESETS[shape].name}
          onChange={(e) => {
            setName(e.target.value)
            setTyped(true)
            setError(undefined)
          }}
        />
      </Field>
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
