// 의미 글꼴 한 벌을 만드는 창.
// 왼쪽에는 후보 조합들이 있고, 오른쪽에는 그 조합들로 짠 화면 하나가 있다.
// 일정한 견본 문장을 늘어놓는 대신 실제로 쓰이는 자리에 놓고 보여 줘서, 이 조합을 쓸지 말지를 화면을 보며 판단하게 한다.

import { createContext, useContext, useState, type FormEvent } from 'react'
import type { Token } from './lib/api'
import { KINDS, shortName, trackName, type Kind } from './lib/catalog'
import { lookOf, missingForTypes, readType, typeCandidates, writeType, type TypeParts } from './lib/types'
import { SetNotice, StepName, nameProblem } from './StepName'
import { TypeScreen, type SlotProps } from './TypeScreen'
import { styleOf } from './Types'
import { Button } from './ui'

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
 * 목록의 순서. 오른쪽 화면 예시에서 위에서 아래로 처음 나오는 차례와 같다. 그래야 목록과 화면을 나란히 훑으며 견줄 수 있다.
 * 만든 뒤 판에 놓이는 순서는 이것이 아니라 내세우기 → 제목 → 본문 → 그 밖의 차례다.
 */
const SCREEN_ORDER = ['overline', 'caption', 'display-lg', 'display', 'title-lg', 'body-lg', 'body', 'body-strong', 'title-md', 'title-sm', 'numeric', 'body-sm', 'code', 'button-sm', 'button', 'label', 'button-lg', 'quote']
const screenRank = (key: string) => (SCREEN_ORDER.indexOf(key) + 1 || SCREEN_ORDER.length + 1)

const PICK = 'h-6 min-w-0 rounded-sm border border-hairline bg-canvas px-1 text-xs text-ink-soft outline-none focus:border-selection disabled:opacity-40'

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
      className={`cursor-pointer outline-offset-2 outline-selection ${className.includes('rounded') ? '' : 'rounded-sm'} ${Tag !== 'span' && !className.includes('border') ? 'w-fit' : ''} ${hot === use ? 'outline-1' : ''} ${row.on ? '' : 'opacity-25'} ${className}`}
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
  const [rows, setRows] = useState<Row[]>(() =>
    typeCandidates(tokens).map(({ on, token, track }) => ({
      key: shortName(STYLE, token.name),
      on,
      name: shortName(STYLE, token.name),
      note: token.note ?? '',
      parts: readType(token.value)!,
      track,
    })),
  )
  // 마우스를 올린 조합. 목록의 줄과 화면 예시의 자리를 서로 짚어 준다.
  const [hot, setHot] = useState<string | null>(null)
  const names = new Set(tokens.map((t) => t.name))
  const missing = missingForTypes(tokens)

  if (rows.length === 0) {
    return (
      <div>
        <p className="text-sm text-ink-soft">
          의미 글꼴은 글꼴 판의 값을 짝지어 만들어요. 글꼴 판에서 <span className="font-[550] text-ink">{missing.join(', ')}</span>부터 만들어 주세요.
        </p>
        <div className="mt-3 flex justify-end">
          <Button onClick={onCancel}>닫기</Button>
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
    <select
      aria-label={`${r.name} ${label}`}
      className={`${PICK} ${width}`}
      disabled={!r.on}
      value={r.parts[part]}
      onChange={(e) => patch(r.key, { parts: { ...r.parts, [part]: e.target.value } })}
    >
      {options(kind).map((t) => (
        <option key={t.name} value={t.name}>
          {show(t)}
        </option>
      ))}
    </select>
  )

  return (
    <ScreenContext.Provider value={{ rows, tokens, hot, setHot, toggle: (key) => patch(key, { on: !rows.find((r) => r.key === key)?.on }) }}>
      <form onSubmit={submit}>
        <div className="flex items-stretch gap-6">
          {/* 후보 조합들. 쓸 것에 표시하고, 이름과 가리키는 값을 고친다. */}
          <div className="w-[660px] shrink-0 space-y-1">
            {[...rows].sort((a, b) => screenRank(a.key) - screenRank(b.key)).map((r) => (
              <div
                key={r.key}
                data-row={r.key}
                onMouseEnter={() => setHot(r.key)}
                onMouseLeave={() => setHot(null)}
                // 줄의 어디를 눌러도 쓸지 말지가 바뀐다. 이름 칸과 고르는 칸은 그 칸의 일을 한다.
                // 바탕의 좌우 여백은 그 끝에 놓인 것의 위아래 여백과 같게 한다. 왼쪽 끝은 체크 상자(16px, 위아래 8px)라 8px, 오른쪽 끝은 고르는 칸(24px, 위아래 4px)이라 4px.
                onClick={(e) => !(e.target as HTMLElement).closest('input, select, label') && patch(r.key, { on: !r.on })}
                className={`flex h-8 cursor-pointer items-center gap-2 rounded-md pr-1 pl-2 ${hot === r.key ? 'bg-hover' : ''}`}
              >
                <label className="flex shrink-0 items-center">
                  <input type="checkbox" aria-label={`${r.name} 쓰기`} className="peer sr-only" checked={r.on} onChange={(e) => patch(r.key, { on: e.target.checked })} />
                  <span
                    className={`flex size-4 items-center justify-center rounded-sm border outline-offset-1 outline-selection peer-focus-visible:outline-2 ${r.on ? 'border-ink bg-ink text-white' : 'border-ink-faint bg-canvas'}`}
                  >
                    {r.on && (
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6.5 5 9l4.5-5.5" />
                      </svg>
                    )}
                  </span>
                </label>
                <span className={r.on ? '' : 'opacity-40'}>
                  <StepName label={`${r.key} 이름`} wide="xl" value={r.name} onChange={(name) => patch(r.key, { name })} />
                </span>
                <span className={`min-w-0 flex-1 text-xs whitespace-nowrap text-ink-faint ${r.on ? '' : 'opacity-40'}`}>
                  {r.note}
                </span>
                {pick(r, FONT, 'font', '글꼴 종류', 'w-20', (t) => shortName(FONT, t.name))}
                {pick(r, SIZE, 'size', '글자 크기', 'w-24', (t) => `${shortName(SIZE, t.name)} · ${t.value}`)}
                {pick(r, WEIGHT, 'weight', '굵기', 'w-28', (t) => `${shortName(WEIGHT, t.name)} · ${t.value}`)}
              </div>
            ))}
          </div>

          {/* 그 조합들로 짠 화면 하나. 이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. */}
          <div data-screen className="min-w-0 flex-1 overflow-hidden rounded-lg border border-hairline bg-canvas p-6 text-ink">
            <TypeScreen T={T} has={has} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {/* 이미 있는 조합이 새 값으로 바뀌는 것은 되돌리기 전에 알아야 하는 일이라 알린다. */}
          {problem ? (
            <span role="alert" className="mr-1 text-sm text-danger">
              {problem}
            </span>
          ) : (
            <>
              <span className="mr-1 text-sm text-ink-faint">{used.length}개를 만들어요.</span>
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
          <Button variant="primary" type="submit">
            만들기
          </Button>
        </div>
      </form>
    </ScreenContext.Provider>
  )
}
