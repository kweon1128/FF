// 움직임 판과 화면 크기 판이 함께 쓰는 줄 목록, 패널, 추가 창.
// 효과 판과 같은 짜임이다. 종류마다 한 줄에 값 하나, 왼쪽에 이름·값·설명, 오른쪽에 그 값이 제 일을 하는 모습.
// 종류마다 다른 것(주석의 이름, 예시의 모양, 값을 적는 칸, 코드에서 쓰는 클래스)은 ValueSpec으로 받는다.

import { useContext, useState, type FormEvent, type ReactNode } from 'react'
import type { Token } from './lib/api'
import { SLUG, slugMessage, shortName, type Kind } from './lib/catalog'
import { readKindNote, writeKindNote, type KindExample, type KindShape } from './lib/kindnote'
import { sampleColors, type SampleColors } from './lib/sample'
import { CODE_OPEN, CodeRows, FoldSection, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UnitInput, UsePicker, inputClass , linkRowClass } from './ui'
import { NUMBER, PARTIAL, ZEROS, nameRules, textRules, useField } from './useField'
import { freeName } from './lib/nearest'
import { useReorder } from './useReorder'
import { WithExample } from './WithExample'

/** 예시를 그릴 때 넘겨받는 것. 색과 그림자는 보여 주는 디자인 시스템의 것이다. */
export type SampleContext = { colors: SampleColors; shadows: { float?: string; dialog?: string }; tokens: Token[] }

/** 값을 이루는 숫자 칸 하나(시간이면 하나, 곡선이면 넷, 비율이면 둘). */
export type Cell = { label: string; unit: string; negative?: boolean; placeholder?: string }

export type ValueSpec<S extends string = string> = {
  /** 주석 맨 앞에 적는 종류의 이름. */
  title: string
  shapes: KindShape<S>[]
  /** 판에 적는 값. 사람이 읽는 꼴로 적는다. */
  shown: (value: string) => string
  /** 예시 하나를 그린다. 예시 칸보다 커서 줄여 그렸으면 note로 몇 분의 일인지 알린다. */
  sample: (example: KindExample<S>, value: string, context: SampleContext) => ReactNode
  /** 줄여 그린 그림이면 값 옆에 적을 말(" · 그림은 1/8"). */
  scaleNote?: (value: string) => string
  /** 코드에서 쓰는 클래스들. */
  classes: (short: string) => string[]
  /** 패널에서 값 구역의 제목. */
  valueTitle: string
  /** 값을 적는 숫자 칸들과, 값을 칸의 숫자로 읽고 숫자를 값으로 적는 법. 읽을 수 없는 꼴의 값은 글자로 고친다. */
  cells: Cell[]
  read: (value: string) => string[] | null
  write: (numbers: number[]) => string | null
  /** 패널에서 숫자 칸만으로 고칠 수 없는 값을 고치는 칸들(애니메이션, 끊기는 곡선). 그 값을 읽을 수 없으면 null을 돌려주고, 그때는 숫자 칸이나 글자로 고친다. */
  fields?: (value: string, onValue: (value: string) => void, tokens: Token[]) => ReactNode | null
  /** 판의 줄에서 값 아래에 두는 작은 그림(이징의 곡선). 값만 읽어서는 어떤 것인지 알 수 없는 종류에 준다. */
  mark?: (value: string) => ReactNode
  /** 추가 창에서 값 칸의 이름표. 주지 않으면 valueTitle이다. */
  addTitle?: string
  /** 추가 창에서 값을 고르면 이름 칸에 채울 이름. 값 자체에 이름이 있는 종류에 준다(애니메이션의 spin). 이미 있는 이름이면 빈 글자를 돌려준다. 이름을 직접 고친 뒤에는 채우지 않는다. */
  nameFor?: (value: string, tokens: Token[]) => string
  /** 추가 창에서 예시를 고르면 이름 칸에 채울 이름(예시의 모양마다 하나). 이름을 직접 고치기 전까지 예시를 따라 바뀐다. nameFor가 있는 종류에는 주지 않는다. */
  shapeNames?: Partial<Record<S, string>>
  /** 추가 창에서 값 칸을 이름 칸보다 먼저 묻는지. 값을 골라야 이름이 정해지는 종류에 준다. */
  valueFirst?: boolean
  /** 추가 창으로 만든 값에 붙일 예시의 모양. 값만 보고 무엇이 움직이는지 알 수 있는 종류에 준다(도는 움직임은 로딩 버튼). 주지 않으면 추가 창에서 모양을 고른다. */
  addShape?: (value: string) => S
  /** 추가 창에서 값을 정하는 칸. 주지 않으면 cells의 숫자 칸이 빈 채로 나온다. draft는 값(아직 정하지 않았으면 빈 글자)이다. */
  addField?: (draft: string, setDraft: (value: string) => void, error: string | undefined, tokens: Token[]) => ReactNode
  /** 추가 창을 열었을 때 골라 두는 값. addField로 고르는 종류(곡선, 움직임)에 준다. 창을 열자마자 예시가 보인다. */
  addStart?: (tokens: Token[]) => string
  /** 추가 창에서 값을 정하지 않았을 때의 알림. */
  missing: string
  /** 숫자로 시작하는 이름을 받는지. 브레이크포인트와 컨테이너 폭은 Tailwind의 이름(2xl)을 쓰므로 받는다. */
  digitNames?: boolean
  /** 그 종류만의 이름 규칙. 쓸 수 없으면 까닭을 돌려준다. */
  nameProblem?: (name: string, tokens: Token[]) => string | null
  /** 추가 창의 이름 칸에 옅게 보이는 본보기. */
  namePlaceholder: string
  /** 예전 앞머리로 적힌 값인지(클래스가 없고 변수로만 쓴다). */
  legacy?: (name: string) => boolean
}


/**
 * 값을 이루는 숫자 칸들. 칸이 모두 숫자이고 값으로 적을 수 있을 때만 알린다.
 * live가 아니면 적는 동안은 알리지 않고 칸을 벗어나거나 Enter를 누를 때 알린다(패널. 적는 중인 숫자가 저장되면 줄이 차례대로 튀어 다닌다). ↑↓는 바로 알린다.
 * live면 적을 때마다 알린다(추가 창. 값이 아직 안 되면 빈 글자를 알린다).
 */
export function CellsInput({ spec, value, onValue, live = false, invalid = false }: { spec: Pick<ValueSpec, 'cells' | 'read' | 'write'>; value: string; /** filled는 live일 때만 넘어온다. 칸이 모두 적혀 있는지다(값이 안 될 때 빈 칸 때문인지 받을 수 없는 숫자 때문인지 가린다). */ onValue: (value: string, filled?: boolean) => void; live?: boolean; invalid?: boolean }) {
  const blank = spec.cells.map(() => '')
  const saved = () => spec.read(value) ?? blank
  const [drafts, setDrafts] = useState(saved)
  // 밖에서 값이 바뀌면(되돌리기, 파일을 직접 고침) 칸을 그 값으로 다시 채운다. 추가 창에서는 여기서 적은 것이 곧 값이라 다시 채우지 않는다.
  const [seen, setSeen] = useState(value)
  if (!live && value !== seen) {
    setSeen(value)
    setDrafts(saved())
  }
  const valueOf = (cells: string[]) => (cells.every((s) => NUMBER.test(s)) ? spec.write(cells.map(Number)) : null)

  function change(i: number, digits: string, typing?: boolean) {
    const next = drafts.map((d, k) => (k === i ? digits : d))
    setDrafts(next)
    const made = valueOf(next)
    if (live) return onValue(made ?? '', next.every((d) => d !== ''))
    if (!typing && made !== null && made !== value) onValue(made)
  }

  /**
   * 칸 분류를 벗어날 때(useField의 약속과 같다). 칸에서 옆 칸으로 옮겨 가는 동안은 아무것도 하지 않는다. 비율이나 곡선은 칸을 다 고쳐야 값이 된다.
   * 고치지 않았으면 저장하지 않는다. ease-out이나 0.3s처럼 적힌 값은 칸에 들어갔다 나오기만 해도 다른 표기로 바뀌어 저장되면 안 된다.
   * 값이 되지 않으면(빈 칸, 숫자가 아님, 범위 밖) 적는 중에 이미 빨갛게 보였다. 저장된 값으로 되돌린다.
   */
  function commit() {
    if (live) return
    const before = saved()
    const untouched = drafts.every((d, i) => d === before[i] || (NUMBER.test(d) && NUMBER.test(before[i]) && Number(d) === Number(before[i])))
    const made = untouched ? null : valueOf(drafts)
    if (made === null) return setDrafts(before)
    if (made !== value) onValue(made)
  }

  // 숫자가 아닌 칸은 그 칸을, 칸은 모두 숫자인데 값이 되지 않으면(범위 밖) 모든 칸을 적는 중에 빨갛게 한다. "-", "0."처럼 적는 도중의 꼴은 아니다.
  // 칸이 하나뿐인 값에서는 0.5를 적는 도중의 0도 알리지 않는다(칸이 여럿이면 0이 제 값인 칸이 있어 가릴 수 없다).
  const unfit = drafts.every((d) => NUMBER.test(d)) && valueOf(drafts) === null && !(drafts.length === 1 && ZEROS.test(drafts[0]))
  const input = (i: number, onBlur?: () => void) => (
    <UnitInput
      label={spec.cells[i].label}
      digits={drafts[i]}
      unit={spec.cells[i].unit}
      negative={spec.cells[i].negative}
      placeholder={spec.cells[i].placeholder}
      invalid={invalid || (drafts[i] !== '' && !NUMBER.test(drafts[i]) && !PARTIAL.test(drafts[i])) || (!live && unfit)}
      onDigits={(digits, typing) => change(i, digits, typing)}
      onBlur={onBlur}
    />
  )
  if (spec.cells.length === 1) return input(0, commit)
  return (
    <div className="grid grid-cols-2 gap-field-row" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && commit()}>
      {spec.cells.map((cell, i) => (
        <Field key={i} label={cell.label}>
          {input(i)}
        </Field>
      ))}
    </div>
  )
}

/**
 * 한 종류의 줄 목록. 한 줄에 값 하나. 왼쪽 칸(224px)에 이름, 값, 설명이 있고 오른쪽에 그 값이 제 일을 하는 모습이 있다.
 * 줄의 단추가 설명과 예시를 함께 감싸므로 선택 선이 둘을 다 두른다. 이름과 값, 설명은 자르지 않고 줄을 바꿔 다 보여 준다.
 */
export function ValueList<S extends string>({
  kind,
  spec,
  items,
  all,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  kind: Kind
  spec: ValueSpec<S>
  items: Token[]
  /** 예시의 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 쓰임으로 이름 붙인 종류에만 준다. 크기의 차례가 있는 종류는 저절로 놓여서 주지 않는다. */
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(items.map((t) => t.name), onMove)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 종류의 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const context: SampleContext = {
    colors: sampleColors(all),
    shadows: { float: all.find((t) => t.name === '--shadow-float')?.value, dialog: all.find((t) => t.name === '--shadow-dialog')?.value },
    tokens: all,
  }
  return (
    <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const { text, examples } = readKindNote(spec.title, spec.shapes, t.note)
        const isSelected = selected.includes(t.name)
        const shown = spec.shown(t.value)
        // 예시는 주석에 모양이 적혀 있을 때만 그린다. 없으면 왼쪽 칸이 줄 전체를 쓴다.
        const drawn = !plain && examples.length > 0
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${shown}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            <span className={drawn ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
              <span data-name className="block type-label break-words">
                {short}
              </span>
              <span data-points className="block type-code-sm break-words text-ink-faint">
                {shown}
                {drawn && spec.scaleNote?.(t.value)}
              </span>
              {!plain && spec.mark?.(t.value)}
              {!plain && text && (
                <span data-text className="mt-label block type-caption break-words text-ink-faint">
                  <Phrases text={text} />
                </span>
              )}
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            {drawn && <span className="block min-w-0 flex-1 space-y-blocks">{examples.map((e, k) => <span key={k} className="block">{spec.sample(e, t.value, context)}</span>)}</span>}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={shown} />}
          </button>
        )
      })}
    </div>
  )
}

/** 이름을 쓸 수 없으면 까닭을 돌려준다. */
function nameProblem(kind: Kind, spec: ValueSpec, name: string, tokens: Token[], self?: string) {
  if (!name) return '이름을 입력해 주세요.'
  if (!SLUG.test(name)) return slugMessage(name)
  // 숫자로 시작하는 이름은 숫자 클래스와 같은 글자가 된다(duration-150). 쓰임의 이름을 짓게 한다.
  if (!spec.digitNames && /^\d/.test(name)) return '숫자로 시작할 수 없어요.'
  if (kind.prefix + name === self) return null
  if (tokens.some((t) => t.name === kind.prefix + name)) return '같은 이름이 이미 있어요.'
  return spec.nameProblem?.(name, tokens) ?? null
}

/**
 * 값 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값, 설명, 쓰이는 곳, 코드.
 * 값은 적는 동안 저장하지 않고, 칸을 벗어나거나 Enter를 누를 때 저장한다.
 * 예시는 여기서 고치지 않는다. 그 값이 화면 어디에 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function ValueInspector<S extends string>({
  token,
  kind,
  spec,
  tokens,
  file,
  uses,
  onOpenComponent,
  onRename,
  onChange,
  onCopy,
}: {
  token: Token
  kind: Kind
  spec: ValueSpec<S>
  tokens: Token[]
  file: string
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  onRename: (next: string) => void
  /** 값이나 주석(설명과 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(kind, token.name)
  const classed = token.name.startsWith(kind.prefix) && !spec.legacy?.(token.name)
  const { text, picked, words, more } = readKindNote(spec.title, spec.shapes, token.note)
  // 이름 칸. 쓸 수 없는 글자는 적는 중에 알리고 벗어나면 되돌린다. 모양이 틀린 이름과 이 판의 규칙은 벗어날 때 알리고 칸에 남긴다(useField).
  const nameField = useField(nameRules({ saved: short, done: (next) => nameProblem(kind, spec as unknown as ValueSpec, next, tokens, token.name), save: (next) => onRename(kind.prefix + next) }))
  const [textDraft, setTextDraft] = useState(text)
  const rawField = useField(textRules({ saved: token.value, save: (value) => onChange({ value }) }))
  // 숫자 칸으로 읽을 수 있는 값인지. 읽을 수 없으면(clamp(), steps(), 낱말) 글자로 고친다.
  const custom = spec.fields?.(token.value, (value) => onChange({ value }), tokens) ?? null
  const celled = custom !== null || spec.read(token.value) !== null

  function commitText() {
    // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
    if (textDraft.trim() !== text) onChange({ note: writeKindNote(spec.title, spec.shapes, textDraft, picked, words, more) })
  }

  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{short}</h2>
      </Section>

      <Section title="이름">
        <input
          className={inputClass}
          value={nameField.draft}
          aria-label="이름"
          data-rename="token"
          onChange={(e) => nameField.type(e.target.value)}
          onBlur={nameField.leave}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {nameField.error && <span className="mt-label block type-body text-danger">{nameField.error}</span>}
      </Section>

      <Section title={spec.valueTitle}>
        {custom !== null ? (
          custom
        ) : celled ? (
          <CellsInput spec={spec} value={token.value} onValue={(value) => onChange({ value })} />
        ) : (
          <input
            aria-label={spec.valueTitle}
            className={inputClass}
            value={rawField.draft}
            onChange={(e) => rawField.type(e.target.value)}
            onBlur={rawField.leave}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        )}
        {/* 글자로 적는 값의 기호 검사는 어느 패널이나 같다. 적는 중에 알리고, 그대로 벗어나면 되돌린다. */}
        {!celled && rawField.error && <span className="mt-label block type-body text-danger">{rawField.error}</span>}
      </Section>

      <Section title="설명">
        <input className={inputClass} aria-label="설명" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={commitText} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length > 0 ? String(uses.length) : '없음'} empty={uses.length === 0}>
        <div className="space-y-blocks">
          {uses.map((u) => (
            <div key={u.index}>
              <button
                type="button"
                onClick={() => onOpenComponent(u.index)}
                className={linkRowClass}
              >
                <span className="truncate">{u.name}</span>
                <span className="ml-row-inner shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
              </button>
              <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
            </div>
          ))}
        </div>
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <CodeRows uses={[...(classed ? spec.classes(short) : []), `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/**
 * 값을 만드는 양식. 이름, 값, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 값은 정하지 않은 채로 시작한다. 미리 채워 두면 이름만 적고 만들었을 때 엉뚱한 값이 말없이 생긴다.
 * 값이 정해지면 판의 줄과 같은 예시를 창 오른쪽의 영역에 보여 준다(WithExample). 값만 보고 모양이 정해지지 않는 종류는 예시의 모양을 여기서 고르고, 고른 모양은 주석에 적힌다(문구는 적지 않아 모양의 기본 문구로 그려진다).
 */
export function NewValueForm<S extends string>({ kind, spec, tokens, onCreate, onCancel }: { kind: Kind; spec: ValueSpec<S>; tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  // 숫자로 적는 값은 흔히 쓰는 값을 채워 둔다(칸에 들어가면 모두 선택되어 바로 덮어쓴다). 고르는 값(곡선, 움직임)은 고를 만한 기본이 없어 비워 둔다.
  // 이름은 채우지 않는다. 쓰임을 적는 자리라 만드는 사람만 알고, 채워 두면 그대로 눌러 뜻 없는 이름이 쌓인다(DESIGN.md dialog-defaults).
  // 고르는 값(곡선, 움직임)은 그 종류가 정한 첫 값을 골라 둔다(addStart). 창을 열자마자 예시가 보인다.
  const [start] = useState(() => (spec.addStart ? spec.addStart(tokens) : spec.addField || !spec.cells.every((c) => c.placeholder) ? '' : (spec.write(spec.cells.map((c) => Number(c.placeholder))) ?? '')))
  const [value, setValue] = useState(start)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; value?: string }>({})
  // 예시의 모양. 처음에는 그 종류의 첫 모양이다. 값만 보고 모양이 정해지는 종류(addShape)는 고르지 않는다.
  const [picked, setPicked] = useState<S | undefined>(spec.shapes[0]?.id)
  const shape = spec.addShape ? (value ? spec.addShape(value) : undefined) : picked
  // 이름 칸은 비워 두고, 고른 예시에 맞는 이름을 옅은 글자로 추천한다(DESIGN.md dialog-defaults). 추천은 값이 아니다. 비운 채 추가하면 "이름을 입력해 주세요."다.
  // 같은 이름이 없더라도 그 종류의 규칙으로 쓸 수 없는 이름(컨테이너 너비의 page는 같은 이름의 의미 크기가 있으면 안 된다)이면 추천하지 않는다.
  const suggested = freeName(tokens, kind.prefix, shape ? spec.shapeNames?.[shape] : undefined)
  // 값에 이름이 있는 종류(애니메이션의 spin)는 고른 값의 이름을 추천한다(nameFor. 그 이름이 이미 있으면 빈 글자다).
  const suggestedName = spec.nameFor ? (value ? spec.nameFor(value, tokens) : '') : suggested && nameProblem(kind, spec as unknown as ValueSpec, suggested, tokens) === null ? suggested : ''
  // 판의 줄(ValueList)과 같은 색과 그림자로 그린다.
  const context: SampleContext = {
    colors: sampleColors(tokens),
    shadows: { float: tokens.find((t) => t.name === '--shadow-float')?.value, dialog: tokens.find((t) => t.name === '--shadow-dialog')?.value },
    tokens,
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    const problem = nameProblem(kind, spec as unknown as ValueSpec, n, tokens)
    if (problem) next.name = problem
    // 칸은 다 적었는데 값이 되지 않으면(너비 0, 비율 0:9) "입력해 주세요"가 아니라 받을 수 없는 값이라고 알린다.
    if (!value) next.value = filled ? '쓸 수 없는 값이에요. 숫자를 확인해 주세요.' : spec.missing
    setError(next)
    if (Object.keys(next).length === 0) onCreate(kind.prefix + n, value, writeKindNote(spec.title, spec.shapes, text, shape))
  }

  const [filled, setFilled] = useState(false)
  const setDraft = (next: string, isFilled = false) => {
    setValue(next)
    setFilled(isFilled)
    setError({ ...error, value: undefined })
  }

  const nameField = (
    <Field label="이름" error={error.name}>
      <input
        autoFocus
        className={inputClass}
        value={name}
        // 옅은 글자는 그대로 적으면 만들어지는 이름일 때만 보인다. 이미 있는 이름을 본보기로 보이면, 따라 적었을 때 되는 창과 안 되는 창이 생긴다.
        placeholder={suggestedName}
        onChange={(e) => {
          setName(e.target.value)
          setError({ ...error, name: undefined })
        }}
      />
    </Field>
  )

  return (
    <form onSubmit={submit}>
      {/* 예시는 값이 정해져야 그린다. 줄여 그린 그림이면 판의 줄과 같은 말로 몇 분의 일인지 알린다. */}
      <WithExample example={value && shape ? spec.sample({ shape, words: '' }, value, context) : null} note={(value && spec.scaleNote?.(value).replace(/^ · /, '')) || undefined}>
      {!spec.valueFirst && nameField}
      <Field label={spec.addTitle ?? spec.valueTitle} plain error={error.value}>
        {spec.addField ? spec.addField(value, setDraft, error.value, tokens) : <CellsInput spec={spec} value={start} live invalid={!!error.value} onValue={setDraft} />}
      </Field>
      {spec.valueFirst && nameField}
      {/* 예시의 모양. 값만 보고 모양이 정해지는 종류에는 이 칸이 없다. */}
      {!spec.addShape && (
        <Field label="예시" plain>
          <UsePicker label="예시" options={spec.shapes} value={picked ?? null} nameWidth={spec.shapes.some((s) => s.label.length > 3) ? 'w-picker-name-wide' : 'w-picker-name'} onChange={setPicked} />
        </Field>
      )}
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
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
