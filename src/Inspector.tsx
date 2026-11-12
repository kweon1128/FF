import { useState, type ReactNode } from 'react'
import { Copy, PencilLine, Pipette, Rows3 } from 'lucide-react'
import type { Token } from './lib/api'
import { SLUG, groupOf, shortName, type Kind } from './lib/catalog'
import { isApprox, showColor, toOklch } from './lib/color'
import { stepValue } from './lib/tokens'
import { ColorSwatch } from './ColorPicker'
import { Button, Chip, Field, inputClass } from './ui'

type Props = {
  token: Token
  kind: Kind
  file: string
  allNames: string[]
  onRename: (next: string) => void
  onValue: (value: string) => void
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  /** 글자를 클립보드에 복사한다. */
  onCopy: (text: string) => void
  /** 화면에서 색을 찍는다(스포이드). 색 값에서만 쓴다. */
  onPickColor: () => void
  /** 이 색을 기준으로 50~950 단계를 만들 수 있으면, 아직 없는 단계의 수. 만들 수 없는 색이면 null. */
  scaleMissing: number | null
  onMakeScale: () => void
}

const ICON_BUTTON =
  'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2'

const HEX6 = /^#[0-9a-f]{6}$/i
const PLAIN = /^[a-z0-9]+$/

// 글자 크기 규칙: 읽고 고치는 내용(항목 이름, 입력칸, 삭제)은 14px,
// 그것을 설명하는 것(구역 제목, 이름표, 코드 표시)은 12px.

/** 패널의 한 구역. 구역 사이에만 전체 폭 구분선을 둔다. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-b border-hairline px-4 py-3 last:border-b-0">
      {title && <h3 className="mb-2 text-sm font-[650]">{title}</h3>}
      {children}
    </section>
  )
}

/** 오른쪽 편집 패널. 선택한 값이 바뀌면 key로 새로 만들어져 입력 중이던 내용이 초기화된다. */
export function Inspector({
  token,
  kind,
  file,
  allNames,
  onRename,
  onValue,
  uses,
  onOpenComponent,
  onCopy,
  onPickColor,
  scaleMissing,
  onMakeScale,
}: Props) {
  const short = shortName(kind, token.name)
  const isColor = kind.id === 'color'
  const initialGroup = isColor ? groupOf(short) : ''
  const initialName = initialGroup ? short.slice(initialGroup.length + 1) : short

  const [groupDraft, setGroupDraft] = useState(initialGroup)
  const [nameDraft, setNameDraft] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)
  // 색은 파일에 oklch로 저장하지만, 여기서는 읽고 쓰기 쉬운 #으로 보여 주고 받는다.
  const [valueDraft, setValueDraft] = useState(kind.id === 'color' ? showColor(token.value) : token.value)
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
    // 색으로 읽히는 값(#, rgb, hsl)은 oklch로 바꿔 저장한다. 읽을 수 없는 값은 적은 그대로 둔다.
    onValue(isColor ? toOklch(next) : next)
  }

  const nameInput = (
    <input
      className={inputClass}
      value={nameDraft}
      aria-label="이름"
      data-rename="token"
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
                data-rename="group"
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
            {nameError && <span className="mt-1 block text-sm text-danger">{nameError}</span>}
          </>
        )}
      </Section>

      <Section title={kind.valueLabel}>
        <span className="flex items-center gap-2">
          {isColor && <ColorSwatch label="색 고르기" value={valueDraft} alpha onChange={changeValue} />}
          <input
            aria-label={kind.valueLabel}
            className={`${inputClass} ${valueError ? 'border-danger focus:border-danger' : ''}`}
            value={valueDraft}
            onChange={(e) => changeValue(e.target.value)}
            onKeyDown={(e) => {
              // ↑↓로 숫자를 올리고 내린다(Shift는 10배). 16px, 1.5처럼 숫자 하나로 된 값만.
              if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
              const next = stepValue(valueDraft, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
              if (next === null) return
              e.preventDefault()
              changeValue(next)
            }}
          />
          {isColor && (
            <button
              type="button"
              title="화면에서 색 찍기 (I)"
              aria-label="화면에서 색 찍기"
              onClick={onPickColor}
              className={ICON_BUTTON}
            >
              <Pipette size={16} strokeWidth={1.5} />
            </button>
          )}
        </span>
        {valueError && <span className="mt-1 block text-sm text-danger">{valueError}</span>}
        {scaleMissing !== null && (
          <Button
            variant="ghost"
            className="mt-2 -ml-2"
            disabled={!HEX6.test(valueDraft.trim())}
            title={
              scaleMissing === 0
                ? '이 색을 기준으로 나머지 단계의 색을 모두 다시 계산해요. 지금 있는 색은 바뀌어요.'
                : '이 색을 기준으로 같은 목록에 50~950 단계를 만들어요. 이미 있는 단계는 그대로 둬요.'
            }
            onClick={onMakeScale}
          >
            <Rows3 size={16} strokeWidth={1.5} />
            {scaleMissing === 0 ? '단계 다시 생성' : '단계 생성'}
          </Button>
        )}
      </Section>

      <Section title="코드">
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">변수 이름</p>
            <span className="flex items-center gap-1">
              <span className="min-w-0 flex-1">
                <Chip>{token.name}</Chip>
              </span>
              <button
                type="button"
                title={`var(${token.name}) 복사`}
                aria-label="코드 복사"
                onClick={() => onCopy(`var(${token.name})`)}
                className={ICON_BUTTON}
              >
                <Copy size={16} strokeWidth={1.5} />
              </button>
            </span>
          </div>
          {isColor && (
            <div>
              <p className="mb-1 text-sm font-[550] text-ink-faint">저장된 값</p>
              <span className="flex items-center gap-1">
                <span className="min-w-0 flex-1">
                  <Chip>{token.value}</Chip>
                </span>
                <button type="button" title="저장된 값 복사" aria-label="저장된 값 복사" onClick={() => onCopy(token.value)} className={ICON_BUTTON}>
                  <Copy size={16} strokeWidth={1.5} />
                </button>
              </span>
              {isApprox(token.value) && (
                <p className="mt-1 text-sm text-ink-faint">화면이 낼 수 없는 선명한 색이라, 위의 # 값은 가장 가까운 색이에요.</p>
              )}
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
      </Section>

      <Section title="쓰이는 곳">
        {uses.length === 0 ? (
          <p className="text-sm text-ink-faint">이 값을 쓰는 컴포넌트가 아직 없어요.</p>
        ) : (
          <div className="space-y-2">
            {uses.map((u) => (
              <div key={u.index}>
                <button
                  type="button"
                  onClick={() => onOpenComponent(u.index)}
                  className="-ml-2 flex h-8 max-w-full items-center rounded-md px-2 font-[550] outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="ml-1.5 shrink-0 text-sm font-normal text-ink-faint">{u.where.length}곳</span>
                </button>
                <p className="text-sm text-ink-faint">{u.where.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/** 여러 값을 함께 선택했을 때의 패널. 무엇을 골랐는지 보여 주고, 이름을 한꺼번에 바꾸는 창을 연다. */
export function MultiInspector({
  tokens,
  group,
  onRenameGroup,
  onRename,
}: {
  tokens: Token[]
  /** 한 색 목록을 통째로 선택했을 때 그 목록의 이름. 아니면 null. */
  group: string | null
  /** 목록 이름을 바꾼다. 바꿀 수 없으면 이유를 돌려준다. */
  onRenameGroup: (next: string) => string | null
  onRename: () => void
}) {
  const [draft, setDraft] = useState(group ?? '')
  const [error, setError] = useState<string | null>(null)

  function commitGroup() {
    const next = draft.trim()
    if (next === group) return setError(null)
    setError(next ? onRenameGroup(next) : '이름을 입력해 주세요.')
  }

  return (
    <div>
      <Section>
        <h2 className="font-[650]">{tokens.length}개 선택됨</h2>
      </Section>

      {group !== null && (
        <Section title="목록 이름">
          <input
            aria-label="목록 이름"
            data-rename="group"
            className={`${inputClass} ${error ? 'border-danger focus:border-danger' : ''}`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError(null)
            }}
            onBlur={commitGroup}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
        </Section>
      )}

      <Section title="선택한 값">
        <div className="flex flex-wrap gap-1">
          {tokens.map((t) => (
            <Chip key={t.name}>{t.name}</Chip>
          ))}
        </div>
      </Section>

      <Section>
        <Button variant="ghost" className="-ml-2" title="Ctrl+R" onClick={onRename}>
          <PencilLine size={16} strokeWidth={1.5} />
          번호 다시 매기기
        </Button>
      </Section>
    </div>
  )
}
