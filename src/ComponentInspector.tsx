import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import type { Token } from './lib/api'
import { KINDS, SLUG, shortName, type Kind } from './lib/catalog'
import { STATES, cellLabel, type Cell, type Colors, type Comp, type IconPos, type Size } from './lib/components'
import { isIconName } from './ComponentScreen'
import { Section } from './Inspector'
import { Button, Chip, Field, inputClass } from './ui'

const ICON_RESULTS = 30

/** 영문 소문자 이름을 고치는 칸. 칸을 벗어나거나 Enter를 누르면 반영한다. */
function NameField({
  label,
  value,
  taken,
  onCommit,
}: {
  label: string
  value: string
  taken: string[]
  onCommit: (name: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  function commit() {
    const name = draft.trim()
    if (name === value) return setError(null)
    if (!name) return setError('이름을 입력해 주세요.')
    if (!SLUG.test(name)) return setError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (taken.includes(name)) return setError('같은 이름이 이미 있어요.')
    onCommit(name)
  }

  return (
    <Field label={label} error={error}>
      <input
        className={inputClass}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(null)
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </Field>
  )
}

/** 기본 값 중에서 하나를 고르는 칸. 직접 적는 값은 받지 않는다. */
function TokenField({
  label,
  kind,
  tokens,
  value,
  empty = '없음',
  onChange,
}: {
  label: string
  kind: Kind
  tokens: Token[]
  value: string | undefined
  empty?: string
  onChange: (name: string | undefined) => void
}) {
  const options = tokens.filter((t) => kind.matches(t.name))
  const current = options.find((t) => t.name === value)
  const missing = value !== undefined && !current

  return (
    <Field
      label={label}
      error={missing ? '고른 값이 기본 값에서 없어졌어요. 다시 골라 주세요.' : null}
      hint={options.length === 0 ? `${kind.title} 값을 먼저 만들어 주세요.` : undefined}
    >
      <span className="flex items-center gap-2">
        {kind.id === 'color' && (
          <span
            className="size-8 shrink-0 rounded-md border border-hairline"
            style={{ background: current?.value }}
          />
        )}
        <select
          className={`${inputClass} min-w-0 ${missing ? 'border-danger' : ''}`}
          value={value ?? ''}
          disabled={options.length === 0 && !missing}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{empty}</option>
          {missing && <option value={value}>{shortName(kind, value)} (없어짐)</option>}
          {options.map((t) => (
            <option key={t.name} value={t.name}>
              {shortName(kind, t.name)} · {t.value}
            </option>
          ))}
        </select>
      </span>
    </Field>
  )
}

const ICON_POSITIONS: { id: IconPos; label: string }[] = [
  { id: 'none', label: '없음' },
  { id: 'before', label: '글자 앞' },
  { id: 'after', label: '글자 뒤' },
]

function IconPicker({ value, onChange }: { value: string | undefined; onChange: (name: string) => void }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = q ? iconNames.filter((n) => n.includes(q)) : iconNames
  const results = matches.slice(0, ICON_RESULTS)

  return (
    <div className="space-y-2">
      <Field label="아이콘" hint={isIconName(value) ? `고른 아이콘: ${value}` : '아직 고르지 않았어요.'}>
        <input
          className={inputClass}
          value={query}
          placeholder="영문으로 검색 (예: arrow, check)"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      {results.length === 0 ? (
        <p className="text-xs text-ink-faint">맞는 아이콘이 없어요.</p>
      ) : (
        <div className="grid grid-cols-6 gap-0.5">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={name === value}
              onClick={() => onChange(name)}
              className={`flex size-8 items-center justify-center rounded-md outline-selection focus-visible:outline-2 ${
                name === value ? 'bg-selection-soft text-ink' : 'text-ink-soft hover:bg-hover hover:text-ink'
              }`}
            >
              <DynamicIcon name={name} size={16} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      )}
      {matches.length > ICON_RESULTS && (
        <p className="text-xs text-ink-faint">
          {matches.length}개 중 {ICON_RESULTS}개만 보여요. 검색어를 더 적어 보세요.
        </p>
      )}
    </div>
  )
}

type Props = {
  comp: Comp
  /** 선택한 칸들. 색과 크기 값은 선택한 칸 모두에 적용되고, 칸에 보이는 값은 마지막 칸의 것이다. */
  cells: Cell[]
  tokens: Token[]
  file: string
  otherNames: string[]
  onChange: (next: Comp) => void
  onDeleteVariant: (index: number) => void
  onDeleteSize: (index: number) => void
  onDelete: () => void
}

/** 컴포넌트 화면의 오른쪽 편집 패널. 고른 칸의 종류와 크기, 그리고 컴포넌트 공통 속성을 고친다. */
export function ComponentInspector({
  comp,
  cells,
  tokens,
  file,
  otherNames,
  onChange,
  onDeleteVariant,
  onDeleteSize,
  onDelete,
}: Props) {
  const cell = cells.at(-1) ?? null
  const single = cells.length === 1
  const variant = cell ? comp.variants[cell.v] : undefined
  const size = cell ? comp.sizes[cell.s] : undefined
  const state = cell ? STATES.find((s) => s.id === cell.state)! : undefined

  function setColor(key: keyof Colors, name: string | undefined) {
    if (!cell || !variant) return
    const variants = comp.variants.map((v, i) => {
      const states = { ...v.states }
      for (const c of cells) if (c.v === i) states[c.state] = { ...states[c.state], [key]: name }
      return { ...v, states }
    })
    onChange({ ...comp, variants })
  }

  function setSize(patch: Partial<Size>) {
    if (!cell) return
    const picked = new Set(cells.map((c) => c.s))
    onChange({ ...comp, sizes: comp.sizes.map((s, i) => (picked.has(i) ? { ...s, ...patch } : s)) })
  }

  const field = { tokens }
  const colorEmpty = cell && cell.state !== 'default' ? '기본 상태를 따름' : '없음'

  return (
    <div>
      <Section>
        <h2 className="font-[650] break-all">{comp.name}</h2>
        <p className="mt-0.5 text-xs text-ink-faint">
          {!cell
            ? '칸을 누르면 그 종류와 크기도 고칠 수 있어요.'
            : single
              ? cellLabel(comp, cell)
              : `${cells.length}칸 선택됨 · 색과 크기 값이 모두에 적용돼요`}
        </p>
      </Section>

      {cell && variant && state && (
        <Section title={single ? `색 · ${variant.name} · ${state.label}` : `색 · ${cells.length}칸`}>
          <div className="space-y-3">
            <TokenField
              {...field}
              label="바탕색"
              kind={KINDS.color}
              empty={colorEmpty}
              value={variant.states[cell.state].bg}
              onChange={(n) => setColor('bg', n)}
            />
            <TokenField
              {...field}
              label="글자색"
              kind={KINDS.color}
              empty={colorEmpty}
              value={variant.states[cell.state].text}
              onChange={(n) => setColor('text', n)}
            />
            <TokenField
              {...field}
              label="테두리색"
              kind={KINDS.color}
              empty={colorEmpty}
              value={variant.states[cell.state].border}
              onChange={(n) => setColor('border', n)}
            />
            {!comp.borderWidth && (
              <p className="text-xs text-ink-faint">테두리는 아래 공통의 테두리 굵기를 골라야 보여요.</p>
            )}
          </div>
        </Section>
      )}

      {cell && single && variant && (
        <Section title="종류">
          <NameField
            label="이름"
            value={variant.name}
            taken={comp.variants.map((v) => v.name)}
            onCommit={(name) =>
              onChange({ ...comp, variants: comp.variants.map((v, i) => (i === cell.v ? { ...v, name } : v)) })
            }
          />
          {comp.variants.length > 1 && (
            <Button variant="danger" className="mt-2 -ml-2" onClick={() => onDeleteVariant(cell.v)}>
              <Trash2 size={16} strokeWidth={1.5} />
              종류 삭제
            </Button>
          )}
        </Section>
      )}

      {cell && size && (
        <Section title="크기">
          <div className="space-y-3">
            {single && (
              <NameField
                label="이름"
                value={size.name}
                taken={comp.sizes.map((s) => s.name)}
                onCommit={(name) => setSize({ name })}
              />
            )}
            <TokenField {...field} label="좌우 여백" kind={KINDS.space} value={size.padX} onChange={(padX) => setSize({ padX })} />
            <TokenField {...field} label="위아래 여백" kind={KINDS.space} value={size.padY} onChange={(padY) => setSize({ padY })} />
            <TokenField {...field} label="글자 크기" kind={KINDS.size} value={size.textSize} onChange={(textSize) => setSize({ textSize })} />
            <TokenField {...field} label="아이콘과 글자 사이" kind={KINDS.space} value={size.gap} onChange={(gap) => setSize({ gap })} />
          </div>
          {single && comp.sizes.length > 1 && (
            <Button variant="danger" className="mt-2 -ml-2" onClick={() => onDeleteSize(cell.s)}>
              <Trash2 size={16} strokeWidth={1.5} />
              크기 삭제
            </Button>
          )}
        </Section>
      )}

      <Section title="공통">
        <div className="space-y-3">
          <Field label="미리보기 글자">
            <input
              className={inputClass}
              value={comp.label}
              onChange={(e) => onChange({ ...comp, label: e.target.value })}
            />
          </Field>
          <TokenField {...field} label="글꼴" kind={KINDS.font} value={comp.font} onChange={(font) => onChange({ ...comp, font })} />
          <TokenField {...field} label="굵기" kind={KINDS.weight} value={comp.weight} onChange={(weight) => onChange({ ...comp, weight })} />
          <TokenField {...field} label="모서리" kind={KINDS.radius} value={comp.radius} onChange={(radius) => onChange({ ...comp, radius })} />
          <TokenField
            {...field}
            label="테두리 굵기"
            kind={KINDS.border}
            value={comp.borderWidth}
            onChange={(borderWidth) => onChange({ ...comp, borderWidth })}
          />
        </div>
      </Section>

      <Section title="아이콘">
        <div className="space-y-3">
          <div role="group" aria-label="아이콘 위치" className="flex rounded-md bg-hover p-0.5">
            {ICON_POSITIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={comp.iconPos === id}
                onClick={() => onChange({ ...comp, iconPos: id })}
                className={`h-7 flex-1 rounded-sm text-sm leading-none font-[550] outline-selection focus-visible:outline-2 ${
                  comp.iconPos === id ? 'border border-hairline bg-canvas text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {comp.iconPos !== 'none' && <IconPicker value={comp.icon} onChange={(icon) => onChange({ ...comp, icon })} />}
        </div>
      </Section>

      <Section title="컴포넌트">
        <div className="space-y-3">
          <NameField label="이름" value={comp.name} taken={otherNames} onCommit={(name) => onChange({ ...comp, name })} />
          <div>
            <p className="mb-1 text-xs font-[550] text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
        <Button variant="danger" className="mt-2 -ml-2" onClick={onDelete}>
          <Trash2 size={16} strokeWidth={1.5} />
          컴포넌트 삭제
        </Button>
      </Section>
    </div>
  )
}
