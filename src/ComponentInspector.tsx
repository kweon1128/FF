import { ICON_STROKE } from './lib/icons'
import { useState } from 'react'
import { Copy, CopyPlus, Trash2 } from 'lucide-react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import type { Token } from './lib/api'
import { KINDS, SLUG, SPACE_REF, shortName, type Kind } from './lib/catalog'
import { showColor } from './lib/color'
import { refOf, resolveColor } from './lib/roles'
import { readType } from './lib/types'
import { cellLabel, type Cell, type Colors, type Comp, type IconPos, type Size } from './lib/components'
import { isIconName } from './ComponentScreen'
import { CODE_OPEN, FoldSection, Section } from './Inspector'
import { Button, Chip, Field, Segmented, UsePicker, inputClass, swatchBackground } from './ui'

const ICON_RESULTS = 30

/** 영문 소문자 이름을 고치는 칸. 칸을 벗어나거나 Enter를 누르면 반영한다. */
function NameField({
  label,
  value,
  taken,
  rename,
  onCommit,
}: {
  /** Ctrl+R이나 더블클릭으로 이 칸에 커서를 옮길 때 찾는 이름. */
  rename?: string
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
        data-rename={rename}
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

/** 의미 글꼴이 가리키는 세 값을 짧게 적은 것. sans · 2xl · semibold */
function specOf(value: string) {
  const parts = readType(value)
  if (!parts) return value
  return [shortName(KINDS.font, parts.font), shortName(KINDS.size, parts.size), shortName(KINDS.weight, parts.weight)].join(' · ')
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
  // 색 칸에서는 의미 색도 고를 수 있다. 쓰임새에 이름을 붙여 둔 색이라 단계 색보다 먼저 보여 준다.
  // 간격 칸에서도 의미 간격을 먼저 보여 준다. 화면은 숫자 간격을 바로 쓰지 않고 쓰임의 이름을 쓴다.
  const roles = kind.id === 'color' ? tokens.filter((t) => KINDS.role.matches(t.name)) : kind.id === 'space' ? tokens.filter((t) => KINDS.spaceUse.matches(t.name)) : []
  // 의미 값의 종류. 의미 간격은 앞머리(--spacing-)가 토대(--gutter-)와 달라서 짧은 이름을 제 종류로 뗀다.
  const roleKind = kind.id === 'space' ? KINDS.spaceUse : KINDS.role
  // 의미 값이 가리키는 것(색은 gray-900, 간격은 그 길이 8px).
  const pointsAt = (t: Token) => {
    const space = SPACE_REF.exec(t.value)?.[1]
    if (space) return tokens.find((x) => x.name === space)?.value ?? '없어짐'
    return (refOf(t.value) ?? t.value).replace(kind.prefix, '')
  }
  const current = [...roles, ...options].find((t) => t.name === value)
  const missing = value !== undefined && !current
  // 목록의 줄들. 맨 위는 고르지 않음("없음"), 그 아래에 의미 값, 그 아래에 토대 값이 온다. 의미 값이 있으면 두 묶음에 제목을 붙인다.
  // 토대의 간격은 이름이 곧 길이라 길이만 적는다.
  const bare = (t: Token) => kind.id === 'space' && `${shortName(kind, t.name)}px` === t.value
  const picks: { id: string; label: string; hint: string; heading?: string }[] = [
    { id: '', label: empty, hint: '' },
    ...roles.map((t, i) => ({ id: t.name, label: shortName(roleKind, t.name), hint: pointsAt(t), heading: i === 0 ? (kind.id === 'space' ? '의미 간격' : '의미 색') : undefined })),
    ...options.map((t, i) => ({
      id: t.name,
      label: bare(t) ? t.value : shortName(kind, t.name),
      hint: bare(t) ? '' : kind.id === 'color' ? showColor(t.value) : kind.id === 'style' ? specOf(t.value) : t.value,
      heading: i === 0 && roles.length > 0 ? (kind.id === 'space' ? '간격' : '색상') : undefined,
    })),
  ]

  return (
    <Field
      label={label}
      plain
      error={missing ? '고른 값이 없어졌어요. 다시 골라 주세요.' : null}
      hint={options.length + roles.length === 0 ? `${kind.title} 값을 먼저 만들어 주세요.` : undefined}
    >
      <span className="flex items-center gap-field-row">
        {kind.id === 'color' && (
          <span
            className="size-swatch-button shrink-0 rounded-control border-edge border-hairline"
            style={{ background: current ? swatchBackground(resolveColor(tokens, current.value) ?? 'transparent') : undefined }}
          />
        )}
        {/* 다른 패널과 같은 고르는 칸이다. 고른 값이 없어졌으면 칸이 "고르기"로 비고 아래에 까닭이 적힌다. */}
        <span className="min-w-0 flex-1">
          <UsePicker label={label} nameWidth="w-cell-long" disabled={options.length + roles.length === 0 && !missing} options={picks} value={missing ? null : (value ?? '')} onChange={(name) => onChange(name || undefined)} />
        </span>
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
    <div className="space-y-blocks">
      <Field label="아이콘" hint={isIconName(value) ? `고른 아이콘: ${value}` : '아직 고르지 않았어요.'}>
        <input
          className={inputClass}
          value={query}
          placeholder="영문으로 찾기 (예: arrow, check)"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      {results.length === 0 ? (
        <p className="type-body text-ink-faint">맞는 아이콘이 없어요.</p>
      ) : (
        <div className="grid grid-cols-6 gap-actions-tight">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={name === value}
              onClick={() => onChange(name)}
              className={`flex size-icon-button items-center justify-center rounded-control outline-selection focus-visible:outline-focus ${
                name === value ? 'bg-selection-soft text-ink' : 'text-ink-soft hover:bg-hover hover:text-ink'
              }`}
            >
              <DynamicIcon name={name} size={16} strokeWidth={ICON_STROKE} />
            </button>
          ))}
        </div>
      )}
      {matches.length > ICON_RESULTS && (
        <p className="type-body text-ink-faint">
          {matches.length}개 중 {ICON_RESULTS}개만 보여요.
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
  onDuplicateVariant: (index: number) => void
  onDuplicateSize: (index: number) => void
  /** 컴포넌트를 CSS로 복사한다. */
  onCopyCss: () => void
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
  onDuplicateVariant,
  onDuplicateSize,
  onCopyCss,
  onDelete,
}: Props) {
  const cell = cells.at(-1) ?? null
  const single = cells.length === 1
  const variant = cell ? comp.variants[cell.v] : undefined
  const size = cell ? comp.sizes[cell.s] : undefined

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

  const colors = cell && variant ? variant.states[cell.state] : undefined
  const common = (patch: Partial<Comp>) => onChange({ ...comp, ...patch })

  // 구역의 차례: 이름, 그다음 피그마의 순서(배치, 모양, 채우기, 테두리, 글자, 아이콘), 코드, 맨 아래에 복제와 삭제. 이름이 맨 위고 저장 위치가 "코드"에 있는 것은 값 패널들과 같다.
  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{comp.name}</h2>
        {cell && (
          <p className="mt-label type-body text-ink-faint">{single ? cellLabel(comp, cell) : `${cells.length}칸 선택됨`}</p>
        )}
      </Section>

      {/* 이름은 맨 위다. 값, 의미 색, 의미 글꼴 패널과 같은 자리다. 칸 하나를 골랐으면 그 칸의 종류와 크기의 이름도 여기서 고친다. */}
      <Section title="이름">
        <div className="space-y-fields">
          <NameField label="컴포넌트" value={comp.name} taken={otherNames} onCommit={(name) => common({ name })} />
          {cell && single && variant && (
            <NameField
              label="종류"
              rename="variant"
              value={variant.name}
              taken={comp.variants.map((v) => v.name)}
              onCommit={(name) =>
                onChange({ ...comp, variants: comp.variants.map((v, i) => (i === cell.v ? { ...v, name } : v)) })
              }
            />
          )}
          {cell && single && size && (
            <NameField label="크기" rename="size" value={size.name} taken={comp.sizes.map((s) => s.name)} onCommit={(name) => setSize({ name })} />
          )}
        </div>
      </Section>

      {cell && size && (
        <Section title="배치">
          <div className="space-y-fields">
            <div className="grid grid-cols-2 gap-field-row">
              <TokenField {...field} label="좌우 여백" kind={KINDS.space} value={size.padX} onChange={(padX) => setSize({ padX })} />
              <TokenField {...field} label="위아래 여백" kind={KINDS.space} value={size.padY} onChange={(padY) => setSize({ padY })} />
            </div>
            <TokenField {...field} label="아이콘과 글자 사이" kind={KINDS.space} value={size.gap} onChange={(gap) => setSize({ gap })} />
          </div>
        </Section>
      )}

      <Section title="모양">
        <TokenField {...field} label="모서리" kind={KINDS.radius} value={comp.radius} onChange={(radius) => common({ radius })} />
      </Section>

      {colors && (
        <Section title="채우기">
          <TokenField
            {...field}
            label="바탕색"
            kind={KINDS.color}
            empty={colorEmpty}
            value={colors.bg}
            onChange={(n) => setColor('bg', n)}
          />
        </Section>
      )}

      <Section title="테두리">
        <div className="space-y-fields">
          {colors && (
            <TokenField
              {...field}
              label="테두리색"
              kind={KINDS.color}
              empty={colorEmpty}
              value={colors.border}
              onChange={(n) => setColor('border', n)}
            />
          )}
          <TokenField
            {...field}
            label="굵기"
            kind={KINDS.border}
            value={comp.borderWidth}
            onChange={(borderWidth) => common({ borderWidth })}
          />
          {colors && !comp.borderWidth && <p className="type-body text-ink-faint">굵기를 골라야 테두리가 보여요.</p>}
        </div>
      </Section>

      <Section title="글자">
        <div className="space-y-fields">
          {colors && (
            <TokenField
              {...field}
              label="글자색"
              kind={KINDS.color}
              empty={colorEmpty}
              value={colors.text}
              onChange={(n) => setColor('text', n)}
            />
          )}
          {/* 글자의 모습은 의미 글꼴 하나로 정한다(크기마다). 의미 글꼴을 고르면 글꼴, 굵기, 크기를 따로 고르는 칸은 쓰이지 않으므로 숨긴다. */}
          {cell && size && (
            <TokenField {...field} label="의미 글꼴" kind={KINDS.style} empty="따로 고르기" value={size.type} onChange={(type) => setSize({ type })} />
          )}
          {!(cell && size?.type) && (
            <>
              <TokenField {...field} label="글꼴" kind={KINDS.font} value={comp.font} onChange={(font) => common({ font })} />
              <div className="grid grid-cols-2 gap-field-row">
                <TokenField {...field} label="굵기" kind={KINDS.weight} value={comp.weight} onChange={(weight) => common({ weight })} />
                {cell && size && (
                  <TokenField {...field} label="크기" kind={KINDS.size} value={size.textSize} onChange={(textSize) => setSize({ textSize })} />
                )}
              </div>
            </>
          )}
          <Field label="미리보기 글자">
            {/* 적는 동안은 저장하지 않고 칸을 벗어나거나 Enter를 누를 때 저장한다(DESIGN.md field-rules). 밖에서 값이 바뀌면(되돌리기) 칸을 새로 만든다. */}
            <input
              key={comp.label}
              aria-label="미리보기 글자"
              className={inputClass}
              defaultValue={comp.label}
              onBlur={(e) => e.target.value !== comp.label && common({ label: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </Field>
        </div>
      </Section>

      <Section title="아이콘">
        <div className="space-y-fields">
          <Segmented label="아이콘 위치" options={ICON_POSITIONS} value={comp.iconPos} onChange={(iconPos) => common({ iconPos })} />
          {comp.iconPos !== 'none' && <IconPicker value={comp.icon} onChange={(icon) => common({ icon })} />}
        </div>
      </Section>

      {/* 저장 위치와 코드 복사는 다른 패널처럼 접히는 "코드" 구역에 둔다. */}
      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <div>
          <p className="mb-label type-label text-ink-faint">저장 위치</p>
          <Chip>{file}</Chip>
        </div>
        <div className="mt-blocks -ml-button-ghost-x">
          <Button variant="ghost" onClick={onCopyCss}>
            <Copy size={16} strokeWidth={ICON_STROKE} />
            CSS 복사
          </Button>
        </div>
      </FoldSection>

      {/* 복제와 삭제는 맨 아래에 모은다. 칸 하나를 골랐을 때만 그 칸의 종류와 크기를 복제하고 지울 수 있다. 버튼의 바탕이 닿지 않게 4px 띄운다. */}
      <Section>
        <div className="-ml-button-ghost-x flex flex-wrap gap-actions-tight">
          {cell && single && variant && (
            <>
              <Button variant="ghost" title="Ctrl+D" onClick={() => onDuplicateVariant(cell.v)}>
                <CopyPlus size={16} strokeWidth={ICON_STROKE} />
                종류 복제
              </Button>
              {comp.variants.length > 1 && (
                <Button variant="danger" onClick={() => onDeleteVariant(cell.v)}>
                  <Trash2 size={16} strokeWidth={ICON_STROKE} />
                  종류 삭제
                </Button>
              )}
            </>
          )}
          {cell && single && size && (
            <>
              <Button variant="ghost" onClick={() => onDuplicateSize(cell.s)}>
                <CopyPlus size={16} strokeWidth={ICON_STROKE} />
                크기 복제
              </Button>
              {comp.sizes.length > 1 && (
                <Button variant="danger" onClick={() => onDeleteSize(cell.s)}>
                  <Trash2 size={16} strokeWidth={ICON_STROKE} />
                  크기 삭제
                </Button>
              )}
            </>
          )}
          <Button variant="danger" onClick={onDelete}>
            <Trash2 size={16} strokeWidth={ICON_STROKE} />
            컴포넌트 삭제
          </Button>
        </div>
      </Section>
    </div>
  )
}
