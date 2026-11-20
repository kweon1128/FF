import { useState, type FormEvent } from 'react'
import type { Token } from './lib/api'
import { SLUG, slugMessage, type Kind } from './lib/catalog'
import { EFFECT_PRESETS, EFFECT_SHAPES, paintShadow, writeEffectNote, type EffectKind, type EffectShape } from './lib/effects'
import { paintGradient } from './lib/gradient'
import { resolveColor } from './lib/roles'
import { sampleColors } from './lib/sample'
import { EffectSample, EffectValueFields } from './Effects'
import { EnterEnds } from './EnterEnds'
import { Button, Field, UsePicker, inputClass } from './ui'
import { WithExample } from './WithExample'

/**
 * 효과(그림자, 투명도, 흐림, 그라데이션)를 만드는 양식. 쓰임, 이름, 값, 설명을 정한다.
 * 효과는 단계가 아니라 쓰임으로 이름 붙이므로, 무엇에 쓸지를 먼저 묻는다. 쓰임을 고르면 그 쓰임의 이름과 추천 값, 설명, 예시 모양이 채워진다.
 * 값은 패널과 같은 칸으로 그 자리에서 고친다(DESIGN.md "추가 창은 패널과 같은 칸을 가진다"). 그대로 만들어도 된다.
 * 쓰임을 바꾸면 값은 새 쓰임의 추천 값으로 바뀐다(메뉴의 그림자를 고치다가 입력칸으로 바꾸면 안쪽 그림자여야 한다). 이름과 설명은 직접 고치기 전까지만 따라 바뀐다.
 * 창 오른쪽의 영역에 판의 줄과 같은 예시를 보여 준다(WithExample). 예시의 모양은 고른 쓰임이라 따로 고르지 않는다.
 */
export function NewEffectForm({
  kind,
  tokens,
  existing,
  onCreate,
  onCancel,
}: {
  kind: Kind
  /** 그림자와 그라데이션의 색을 색상 판에서 고를 때 쓰는 전체 값 목록. */
  tokens: Token[]
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
  // 이름 칸은 비워 두고, 고른 쓰임의 이름을 옅은 글자로 추천한다(다른 추가 창과 같다).
  const [name, setName] = useState('')
  const [value, setValue] = useState(EFFECT_PRESETS[first.id].value)
  const [text, setText] = useState(EFFECT_PRESETS[first.id].text)
  // 이름과 설명을 직접 고치기 전까지는 고른 쓰임의 것을 따라간다.
  const [typedText, setTypedText] = useState(false)
  const [error, setError] = useState<string>()
  // 판의 줄(EffectList)과 같은 색으로 그린다. 색상 판의 값을 가리키는 그림자와 그라데이션은 이 시스템의 그 색으로 바꿔 그린다.
  const around = sampleColors(tokens)
  const painted = id === 'shadow' ? paintShadow(value, (name) => resolveColor(tokens, `var(${name})`)) : id === 'gradient' ? paintGradient(value, (name) => resolveColor(tokens, `var(${name})`)?.slice(0, 7) ?? null) : value

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const problem = !n ? '이름을 입력해 주세요.' : !SLUG.test(n) ? slugMessage(n) : existing.has(n) ? '같은 이름이 이미 있어요.' : undefined
    setError(problem)
    if (problem) return
    onCreate(kind.prefix + n, value, writeEffectNote(id, text, shape))
  }

  return (
    <form onSubmit={submit}>
      <WithExample example={<EffectSample shape={shape} value={painted} around={around} accent={around.selection} />}>
      <Field label="쓰임" plain>
        <UsePicker
          label="쓰임"
          options={shapes}
          value={shape}
          onChange={(next) => {
            setShape(next)
            setValue(EFFECT_PRESETS[next].value)
            if (!typedText) setText(EFFECT_PRESETS[next].text)
            setError(undefined)
          }}
        />
      </Field>
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          // 옅은 글자는 그대로 적으면 만들어지는 이름일 때만 보인다. 이미 있는 이름을 본보기로 보이면, 따라 적었을 때 되는 창과 안 되는 창이 생긴다.
          placeholder={free(shape)}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
        />
      </Field>
      <Field label={kind.title} plain>
        <EnterEnds>
          {/* 쓰임을 바꾸면 값 칸을 새로 만든다. 칸들이 적는 중이던 숫자를 새 값 위에 남기지 않게 한다. */}
          <EffectValueFields key={shape} id={id} value={value} tokens={tokens} onChange={setValue} />
        </EnterEnds>
      </Field>
      <Field label="설명">
        <input
          className={inputClass}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setTypedText(true)
          }}
        />
      </Field>
      </WithExample>
      <div className="mt-dialog-actions flex justify-end gap-actions">
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
