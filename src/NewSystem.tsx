import { useState, type FormEvent } from 'react'
import { createSystem } from './lib/api'
import { SLUG } from './lib/catalog'
import { Button, Field, inputClass } from './ui'

/** 새 디자인 시스템의 이름을 받아 만드는 입력 양식. 첫 화면과 확인 창에서 함께 쓴다. */
export function NewSystemForm({
  onCreated,
  onCancel,
}: {
  onCreated: (name: string) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('이름을 입력해 주세요.')
    if (!SLUG.test(trimmed)) return setError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    setBusy(true)
    try {
      await createSystem(trimmed)
      onCreated(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : '만들지 못했어요.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="w-full text-left">
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="my-app"
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button variant="primary" type="submit" disabled={busy}>
          만들기
        </Button>
      </div>
    </form>
  )
}
