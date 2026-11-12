import { useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import type { Token } from './lib/api'
import { SLUG, groupOf, shortName, type Kind } from './lib/catalog'
import { Button, Chip, Field, inputClass } from './ui'

type Props = {
  token: Token
  kind: Kind
  file: string
  allNames: string[]
  onRename: (next: string) => void
  onValue: (value: string) => void
  onDelete: () => void
}

const HEX6 = /^#[0-9a-f]{6}$/i
const PLAIN = /^[a-z0-9]+$/

// 글자 크기 규칙: 읽고 고치는 내용(항목 이름, 입력칸, 삭제)은 14px,
// 그것을 설명하는 것(구역 제목, 이름표, 코드 표시)은 12px.

/** 패널의 한 구역. 구역 사이에만 전체 폭 구분선을 둔다. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-b border-hairline px-4 py-3 last:border-b-0">
      {title && <h3 className="mb-2 text-xs font-[650]">{title}</h3>}
      {children}
    </section>
  )
}

/** 오른쪽 편집 패널. 선택한 값이 바뀌면 key로 새로 만들어져 입력 중이던 내용이 초기화된다. */
export function Inspector({ token, kind, file, allNames, onRename, onValue, onDelete }: Props) {
  const short = shortName(kind, token.name)
  const isColor = kind.id === 'color'
  const initialGroup = isColor ? groupOf(short) : ''
  const initialName = initialGroup ? short.slice(initialGroup.length + 1) : short

  const [groupDraft, setGroupDraft] = useState(initialGroup)
  const [nameDraft, setNameDraft] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [valueDraft, setValueDraft] = useState(token.value)
  const [valueError, setValueError] = useState<string | null>(null)

  function commitName() {
    const group = groupDraft.trim()
    const name = nameDraft.trim()
    setGroupError(null)
    setNameError(null)
    if (group && !SLUG.test(group)) return setGroupError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (!name) return setNameError('이름을 입력해 주세요.')
    if (isColor ? !PLAIN.test(name) : !SLUG.test(name)) {
      return setNameError(isColor ? '영문 소문자와 숫자만 쓸 수 있어요.' : '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    }
    const next = group ? `${group}-${name}` : name
    if (next === short) return
    if (allNames.includes(kind.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    onRename(kind.prefix + next)
  }

  function changeValue(raw: string) {
    setValueDraft(raw)
    const next = raw.trim()
    if (!next) return setValueError('값을 입력해 주세요.')
    if (/[;{}]/.test(next)) return setValueError('; { } 기호는 쓸 수 없어요.')
    setValueError(null)
    onValue(next)
  }

  const nameInput = (
    <input
      className={inputClass}
      value={nameDraft}
      aria-label="이름"
      onChange={(e) => {
        setNameDraft(e.target.value)
        setNameError(null)
      }}
      onBlur={commitName}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )

  return (
    <div>
      <Section>
        <h2 className="font-[650] break-all">{short}</h2>
      </Section>

      <Section title="이름">
        {isColor ? (
          <div className="space-y-2">
            <Field label="목록" error={groupError}>
              <input
                className={inputClass}
                value={groupDraft}
                onChange={(e) => {
                  setGroupDraft(e.target.value)
                  setGroupError(null)
                }}
                onBlur={commitName}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </Field>
            <Field label="이름" error={nameError}>
              {nameInput}
            </Field>
          </div>
        ) : (
          <>
            {nameInput}
            {nameError && <span className="mt-1 block text-xs text-danger">{nameError}</span>}
          </>
        )}
      </Section>

      <Section title={kind.valueLabel}>
        <span className="flex items-center gap-2">
          {isColor && (
            // 둥근 사각형 전체를 색으로 채운다. 색 선택 창은 그 위에 투명하게 겹쳐 둔 입력칸이 연다.
            <span
              className="relative size-8 shrink-0 overflow-hidden rounded-md border border-hairline focus-within:border-selection"
              style={{ background: valueDraft }}
            >
              {HEX6.test(valueDraft.trim()) && (
                <input
                  type="color"
                  aria-label="색 고르기"
                  value={valueDraft.trim().toLowerCase()}
                  onChange={(e) => changeValue(e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              )}
            </span>
          )}
          <input
            aria-label={kind.valueLabel}
            className={`${inputClass} ${valueError ? 'border-danger focus:border-danger' : ''}`}
            value={valueDraft}
            onChange={(e) => changeValue(e.target.value)}
          />
        </span>
        {valueError && <span className="mt-1 block text-xs text-danger">{valueError}</span>}
      </Section>

      <Section title="코드">
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs font-[550] text-ink-faint">변수 이름</p>
            <Chip>{token.name}</Chip>
          </div>
          <div>
            <p className="mb-1 text-xs font-[550] text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
      </Section>

      <Section>
        <Button variant="danger" className="-ml-2" onClick={onDelete}>
          <Trash2 size={16} strokeWidth={1.5} />
          삭제
        </Button>
      </Section>
    </div>
  )
}

/** 여러 값을 함께 선택했을 때의 편집 패널. 같은 종류끼리면 값을 한 번에 바꿀 수 있다. */
export function MultiInspector({
  tokens,
  kind,
  onValue,
  onDelete,
}: {
  tokens: Token[]
  /** 선택한 값이 모두 같은 종류일 때만 있다. */
  kind: Kind | null
  onValue: (value: string) => void
  onDelete: () => void
}) {
  const same = tokens.every((t) => t.value === tokens[0].value)
  const [draft, setDraft] = useState(same ? tokens[0].value : '')
  const [error, setError] = useState<string | null>(null)

  function change(raw: string) {
    setDraft(raw)
    const next = raw.trim()
    if (!next) return setError('값을 입력해 주세요.')
    if (/[;{}]/.test(next)) return setError('; { } 기호는 쓸 수 없어요.')
    setError(null)
    onValue(next)
  }

  return (
    <div>
      <Section>
        <h2 className="font-[650]">{tokens.length}개 선택됨</h2>
        <p className="mt-0.5 text-xs text-ink-faint">Shift를 누른 채 누르면 선택에 더하거나 뺄 수 있어요.</p>
      </Section>

      <Section title="선택한 값">
        <div className="flex flex-wrap gap-1">
          {tokens.map((t) => (
            <Chip key={t.name}>{t.name}</Chip>
          ))}
        </div>
      </Section>

      {kind && (
        <Section title={`${kind.valueLabel} 한 번에 바꾸기`}>
          <input
            aria-label={kind.valueLabel}
            className={`${inputClass} ${error ? 'border-danger focus:border-danger' : ''}`}
            value={draft}
            placeholder={same ? undefined : '서로 다른 값'}
            onChange={(e) => change(e.target.value)}
          />
          {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
        </Section>
      )}

      <Section>
        <Button variant="danger" className="-ml-2" onClick={onDelete}>
          <Trash2 size={16} strokeWidth={1.5} />
          {tokens.length}개 삭제
        </Button>
      </Section>
    </div>
  )
}
