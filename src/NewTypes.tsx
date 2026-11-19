// 의미 글꼴 한 벌을 만드는 창.
// 왼쪽에는 후보 조합들이 있고, 오른쪽에는 그 조합들로 짠 화면 하나가 있다.
// 일정한 견본 문장을 늘어놓는 대신 실제로 쓰이는 자리에 놓고 보여 줘서, 이 조합을 쓸지 말지를 화면을 보며 판단하게 한다.

import { ICON_STROKE } from './lib/icons'
import { createContext, useContext, useState, type FormEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, shortName, trackName, type Kind } from './lib/catalog'
import { lookOf, missingForTypes, readType, typeCandidates, writeType, type TypeParts } from './lib/types'
import { SetNotice, StepName, nameProblem } from './StepName'
import { useUndo } from './lib/useUndo'
import { TypeScreen, type SlotProps } from './TypeScreen'
import { styleOf } from './Types'
import { PreviewSpace } from './ColorUses'
import { Button, UsePicker } from './ui'
import { Check as CheckIcon } from 'lucide-react'
import { CHECK_STROKE } from './lib/icons'

const STYLE = KINDS.style
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight

/**
 * key는 화면 예시의 자리와 이어 주는 처음 이름이다. 이름을 고쳐도 자리는 그대로다.
 * track은 이 조합에 직접 정해 둔 글자 사이(없으면 크기를 따른다).
 */
type Row = { key: string; on: boolean; name: string; note: string; parts: TypeParts; track?: string }

/**
 * 목록의 묶음과 순서. 같은 식구끼리 묶고 이름표를 붙이며, 묶음 안에서는 큰 것부터 놓는다.
 * 화면 예시에 나오는 차례를 따르지 않는다. 그러면 title-lg와 title-md 사이에 본문이 끼는 식으로 식구가 흩어진다. 화면과의 짝은 마우스를 올리면 이어지는 표시가 맡는다.
 * 어느 묶음에도 없는 것은 맨 아래 "그 밖"에 모인다.
 */
const GROUPS: [label: string, keys: string[]][] = [
  ['제목', ['display-xl', 'display-lg', 'display', 'title-lg', 'title-md', 'title-sm']],
  ['본문', ['body-lg', 'body', 'body-strong', 'body-sm', 'quote']],
  ['보조', ['caption', 'overline', 'label']],
  ['버튼', ['button-lg', 'button', 'button-sm']],
  ['숫자·코드', ['numeric', 'code']],
]
const GROUPED = new Set(GROUPS.flatMap(([, keys]) => keys))
/** 줄들을 묶음으로 나눈다. 빈 묶음은 빼고, 묶음 안의 순서는 GROUPS에 적힌 대로다. */
function grouped(rows: Row[]): [label: string, list: Row[]][] {
  const made = GROUPS.map(([label, keys]): [string, Row[]] => [label, keys.flatMap((key) => rows.filter((r) => r.key === key))])
  made.push(['그 밖', rows.filter((r) => !GROUPED.has(r.key))])
  return made.filter(([, list]) => list.length > 0)
}

const ScreenContext = createContext<{ rows: Row[]; tokens: Token[]; hot: string | null; setHot: (key: string | null) => void; toggle: (key: string) => void }>({
  rows: [],
  tokens: [],
  hot: null,
  setHot: () => {},
  toggle: () => {},
})

/**
 * 화면 예시 속의 글자 한 자리. 그 조합의 모습으로 그린다.
 * 쓰지 않기로 한 조합의 자리는 흐리게 남겨서, 빼면 화면의 어디가 비는지 보이게 한다. 누르면 쓸지 말지가 바뀐다.
 */
function T({ use, as: Tag = 'span', className = '', children }: SlotProps) {
  const { rows, tokens, hot, setHot, toggle } = useContext(ScreenContext)
  const row = rows.find((r) => r.key === use)
  if (!row) return null
  const look = lookOf(tokens, writeType(row.parts, new Set(tokens.map((t) => t.name))))
  return (
    <Tag
      data-use={use}
      data-on={row.on}
      title={`${row.name} · ${row.on ? '쓰는 중' : '안 씀'}`}
      onMouseEnter={() => setHot(use)}
      onMouseLeave={() => setHot(null)}
      onClick={() => toggle(use)}
      // 제목처럼 한 줄을 다 차지하는 글자는 폭을 글자에 맞춘다. 그래야 마우스를 올렸을 때의 선이 빈 줄 끝까지 가지 않고 글자만 두른다.
      // 버튼이나 입력칸처럼 상자를 가진 자리는 상자까지가 한 덩어리라, 선도 흐려지는 것도 상자째로 움직인다.
      className={`cursor-pointer outline-offset-[2px] outline-selection ${className.includes('rounded') ? '' : 'rounded-small'} ${Tag !== 'span' && !className.includes('border') ? 'w-fit' : ''} ${hot === use ? 'outline-mark' : ''} ${row.on ? '' : 'opacity-[0.25]'} ${className}`}
      style={look ? { ...styleOf(look), ...(row.track ? { letterSpacing: row.track } : {}) } : undefined}
    >
      {children}
    </Tag>
  )
}

export function NewTypesForm({
  tokens,
  users = {},
  onCreate,
  onCancel,
}: {
  tokens: Token[]
  /** 이미 있는 의미 글꼴마다 그것을 쓰는 컴포넌트들. 쓰이는 조합이 지워질 때 알린다. */
  users?: Record<string, string[]>
  onCreate: (made: Token[]) => void
  onCancel: () => void
}) {
  // 처음 열었을 때의 후보들. "원래대로"가 돌아갈 곳이다.
  const [first] = useState<Row[]>(() =>
    typeCandidates(tokens).map(({ on, token, track }) => ({
      key: shortName(STYLE, token.name),
      // 처음에는 자주 쓰는 것(제목 셋, 본문, 본문 강조, 보조 설명, 이름표, 버튼)과 내세우는 자리들이 켜져 있다. 이것들만으로 판에 있는 크기가 모두 쓰인다.
      // 나머지는 서비스에 따라 쓰는 것이라 화면을 보고 켠다.
      on,
      name: shortName(STYLE, token.name),
      note: token.note ?? '',
      parts: readType(token.value)!,
      track,
    })),
  )
  const [rows, setRows] = useState(first)
  // 처음과 달라진 것이 있는지(쓸지 말지, 이름, 가리키는 값).
  const changed = JSON.stringify(rows) !== JSON.stringify(first)
  // 마우스를 올린 조합. 목록의 줄과 화면 예시의 자리를 서로 짚어 준다.
  const [hot, setHot] = useState<string | null>(null)
  // 창 안에서 고르고 고친 것(쓸지 말지, 이름, 가리키는 값)을 Ctrl+Z로 되돌리고 Ctrl+Shift+Z로 다시 실행한다.
  useUndo(rows, setRows)
  const names = new Set(tokens.map((t) => t.name))
  const missing = missingForTypes(tokens)

  if (rows.length === 0) {
    return (
      <div>
        <p className="type-body text-ink-soft">
          의미 글꼴은 글꼴 판의 값을 짝지어 만들어요. 글꼴 판에서 <span className="type-label text-ink">{missing.join(', ')}</span>부터 만들어 주세요.
        </p>
        <div className="mt-dialog-actions flex justify-end">
          <Button autoFocus onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )
  }

  const patch = (key: string, change: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...change } : r)))
  const used = rows.filter((r) => r.on)
  const problem = used.length === 0 ? '쓸 조합을 하나 이상 골라 주세요.' : nameProblem(used.map((r) => r.name))
  const has = (key: string) => rows.some((r) => r.key === key)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (problem) return
    // 글자 사이를 직접 정해 둔 조합은 그 값을 바로 뒤에 함께 넣는다.
    onCreate(
      used.flatMap((r) => [
        { name: STYLE.prefix + r.name, value: writeType(r.parts, names), note: r.note },
        ...(r.track ? [{ name: trackName(STYLE.prefix + r.name), value: r.track }] : []),
      ]),
    )
  }

  const options = (kind: Kind) => tokens.filter((t) => kind.matches(t.name))
  const pick = (r: Row, kind: Kind, part: 'font' | 'size' | 'weight', label: string, width: string, show: (t: Token) => string) => (
    // 다른 곳과 같은 고르는 칸의 작은 것이다. 브라우저의 select는 목록의 모양이 기기마다 다르다.
    <span className={`${width} shrink-0`}>
      <UsePicker
        small
        label={`${r.name} ${label}`}
        disabled={!r.on}
        nameWidth="min-w-0 flex-1"
        options={options(kind).map((t) => ({ id: t.name, label: show(t), hint: '' }))}
        value={options(kind).some((t) => t.name === r.parts[part]) ? r.parts[part] : null}
        onChange={(name) => patch(r.key, { parts: { ...r.parts, [part]: name } })}
      />
    </span>
  )

  return (
    <ScreenContext.Provider value={{ rows, tokens, hot, setHot, toggle: (key) => patch(key, { on: !rows.find((r) => r.key === key)?.on }) }}>
      {/* 창의 높이는 화면에 맞춰 고정되어 있다(Modal의 tall). 목록이 길면 목록만 스크롤되고, 아래 버튼 줄은 늘 보인다. */}
      <form onSubmit={submit} className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 items-stretch gap-groups">
          {/* 후보 조합들. 쓸 것에 표시하고, 이름과 가리키는 값을 고친다. */}
          <div data-list className="w-[676px] shrink-0 overflow-y-auto [scrollbar-gutter:stable]">
            {grouped(rows).map(([label, list]) => (
            <div key={label} data-group={label} className="first:[&>p]:pt-0">
              {/* 묶음의 이름표. 글꼴 종류 추가 창의 목록과 같은 모양이다. */}
              <p className="px-row-x pt-blocks pb-label type-caption-strong text-ink-faint">{label}</p>
              {/* 마우스를 올린 줄의 바탕이 서로 닿지 않게 줄 사이를 4px 띄운다. */}
              <div className="space-y-rows">
            {list.map((r) => (
              <div
                key={r.key}
                data-row={r.key}
                onMouseEnter={() => setHot(r.key)}
                onMouseLeave={() => setHot(null)}
                // 줄의 어디를 눌러도 쓸지 말지가 바뀐다. 이름 칸과 고르는 칸은 그 칸의 일을 한다.
                // 바탕의 좌우 여백은 그 끝에 놓인 것의 위아래 여백과 같게 한다. 왼쪽 끝은 체크 상자(16px, 위아래 8px)라 8px, 오른쪽 끝은 고르는 칸(24px, 위아래 4px)이라 4px.
                onClick={(e) => !(e.target as HTMLElement).closest('input, button, label') && patch(r.key, { on: !r.on })}
                className={`flex h-row cursor-pointer items-center gap-row-inner rounded-row pr-menu pl-row-x ${hot === r.key ? 'bg-hover' : ''}`}
              >
                <label className="flex shrink-0 items-center">
                  <input type="checkbox" aria-label={`${r.name} 쓰기`} className="peer sr-only" checked={r.on} onChange={(e) => patch(r.key, { on: e.target.checked })} />
                  <span
                    className={`flex size-checkbox items-center justify-center rounded-small border-edge outline-offset-[1px] outline-selection peer-focus-visible:outline-focus ${r.on ? 'border-ink bg-ink text-on-primary' : 'border-ink-faint bg-canvas'}`}
                  >
                    {/* 체크 표시는 다른 체크박스(ui.tsx의 Check)와 같은 아이콘, 같은 굵기다. */}
                    {r.on && <CheckIcon size={12} strokeWidth={CHECK_STROKE} />}
                  </span>
                </label>
                <span className={r.on ? '' : 'opacity-disabled'}>
                  <StepName label={`${r.key} 이름`} wide="xl" value={r.name} onChange={(name) => patch(r.key, { name })} />
                </span>
                <span className={`min-w-0 flex-1 type-caption whitespace-nowrap text-ink-faint ${r.on ? '' : 'opacity-disabled'}`}>
                  {r.note}
                </span>
                {pick(r, FONT, 'font', '글꼴 종류', 'w-[80px]', (t) => shortName(FONT, t.name))}
                {pick(r, SIZE, 'size', '글자 크기', 'w-[96px]', (t) => `${shortName(SIZE, t.name)} · ${t.value}`)}
                {pick(r, WEIGHT, 'weight', '굵기', 'w-[112px]', (t) => `${shortName(WEIGHT, t.name)} · ${t.value}`)}
              </div>
            ))}
              </div>
            </div>
            ))}
          </div>

          {/* 그 조합들로 짠 화면 하나. 이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. */}
          <div data-screen className="min-w-0 flex-1 overflow-y-auto rounded-float border-edge border-hairline bg-canvas p-board text-ink">
            <PreviewSpace>
              <TypeScreen T={T} has={has} />
            </PreviewSpace>
          </div>
        </div>

        <div className="mt-dialog-actions flex shrink-0 items-center justify-end gap-actions">
          {/* 바꾼 것을 모두 처음으로 돌린다. 다른 한 벌 만들기 창들과 같은 자리다. 바꾼 것이 없으면 꺼져 있다. */}
          <Button variant="ghost" className="mr-auto" disabled={!changed} title="쓸지 말지와 고친 이름, 값을 모두 처음으로 돌려요" onClick={() => setRows(first)}>
            <RotateCcw size={16} strokeWidth={ICON_STROKE} />
            원래대로
          </Button>
          {/* 이미 있는 조합이 새 값으로 바뀌는 것은 되돌리기 전에 알아야 하는 일이라 알린다. */}
          {problem ? (
            <span role="alert" className="mr-actions-tight type-body text-danger">
              {problem}
            </span>
          ) : (
            <>
              <span className="mr-actions-tight type-body text-ink-faint">{used.length}개를 만들어요.</span>
              <SetNotice
                made={used.map((r) => r.name)}
                existing={tokens.filter((x) => STYLE.matches(x.name)).map((x) => shortName(STYLE, x.name))}
                users={users}
              />
            </>
          )}
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="submit" disabled={!!problem}>
            만들기
          </Button>
        </div>
      </form>
    </ScreenContext.Provider>
  )
}
