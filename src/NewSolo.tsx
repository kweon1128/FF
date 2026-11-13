import { useState, type FormEvent } from 'react'
import { ColorSwatch } from './ColorPicker'
import { asHex } from './lib/color'
import { Button, Field, inputClass } from './ui'

const HEX6 = /^#[0-9a-f]{6}$/i
// 예외 색의 이름에는 하이픈을 쓸 수 없다. 하이픈이 있으면 그 앞부분이 목록 이름이 된다.
const NAME = /^[a-z0-9]+$/
/** 이름만 보고도 색을 알 수 있는 것들. 색을 비워 두면 이 색을 추천한다. */
const KNOWN: Record<string, string> = { white: '#ffffff', black: '#000000' }
const FALLBACK = '#868686'

/** 단계 목록에 속하지 않는 예외 색(white, black 등)을 만드는 양식. 이름과 색을 정한다. */
export function NewSoloForm({
  existing,
  onCreate,
  onCancel,
}: {
  /** 이미 있는 예외 색의 이름과 목록 이름들. */
  existing: Set<string>
  onCreate: (name: string, color: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [error, setError] = useState<{ name?: string; color?: string }>({})

  // #을 빼고 적어도 받는다.
  const typed = HEX6.test(asHex(color) ?? '') ? asHex(color) : null
  // 색을 비워 두면 이름에 맞는 색(white면 흰색)을, 모르는 이름이면 가운데 밝기의 회색을 추천한다.
  const suggested = KNOWN[name.trim()] ?? FALLBACK

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof error = {}
    const n = name.trim()
    if (!n) next.name = '이름을 입력해 주세요.'
    else if (!NAME.test(n)) next.name = '영문 소문자와 숫자만 쓸 수 있어요.'
    else if (existing.has(n)) next.name = '같은 이름이 이미 있어요.'
    if (color.trim() && !typed) next.color = '#rrggbb로 적어 주세요.'
    setError(next)
    if (Object.keys(next).length === 0) onCreate(n, typed ?? suggested)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="white"
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="색" error={error.color}>
        <span className="flex items-center gap-2">
          <ColorSwatch
            label="색 고르기"
            preview
            value={typed ?? suggested}
            onChange={(hex) => {
              setColor(hex)
              setError({ ...error, color: undefined })
            }}
          />
          <input
            aria-label="색 값"
            className={`${inputClass} font-mono`}
            value={color}
            placeholder={suggested}
            onChange={(e) => {
              setColor(e.target.value)
              setError({ ...error, color: undefined })
            }}
          />
        </span>
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
