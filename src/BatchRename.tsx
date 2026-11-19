import { useState } from 'react'
import type { Token } from './lib/api'
import { SLUG, groupOf, shortName } from './lib/catalog'
import { kindOf } from './lib/tokens'
import { Button, Field, Modal, inputClass } from './ui'

/** 흔히 쓰는 11단계. 시작과 끝이 이 안에 있고 개수가 맞으면 이 단계를 그대로 쓴다(50, 100, 200 … 900, 950). */
const STANDARD = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

/** 시작 번호와 끝 번호 사이를 개수에 맞게 나눈 번호들. */
function numbers(count: number, start: number, end: number): number[] {
  if (count === 1) return [start]
  const a = STANDARD.indexOf(start)
  const b = STANDARD.indexOf(end)
  if (a !== -1 && b !== -1 && b - a + 1 === count) return STANDARD.slice(a, b + 1)
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, i) => Math.round(start + step * i))
}

/** 변수 이름을 종류 앞부분(--color-), 목록 이름(primary), 나머지로 나눈다. */
function split(name: string) {
  const kind = kindOf(name)
  const short = kind ? shortName(kind, name) : name
  return { prefix: name.slice(0, name.length - short.length), short, group: groupOf(short) }
}

/**
 * 색 목록의 단계 색 여러 개의 번호를 한꺼번에 다시 매기는 창(Ctrl+R). 번호가 이름인 것은 단계 색뿐이라 다른 값에는 열리지 않는다.
 * 까닭(겹치는 이름)이 줄마다 이미 보이므로, 낼 수 없을 때는 주 버튼을 끈다(DESIGN.md dialog).
 * 이름의 앞부분(목록 이름)은 그대로 두고, 시작 번호와 끝 번호 사이를 개수에 맞게 나눠 붙인다.
 * 여러 목록을 함께 골랐으면 목록마다 따로 매긴다.
 */
export function BatchRename({
  picked,
  allNames,
  onApply,
  onClose,
}: {
  /** 선택한 값들. 화면에 놓인 순서대로. */
  picked: Token[]
  allNames: string[]
  /** 원래 이름 → 새 이름 */
  onApply: (renames: Record<string, string>) => void
  onClose: () => void
}) {
  const parts = picked.map((t) => ({ old: t.name, ...split(t.name) }))
  const listOf = (p: (typeof parts)[number]) => p.prefix + p.group
  const sizes = new Map<string, number>()
  for (const p of parts) sizes.set(listOf(p), (sizes.get(listOf(p)) ?? 0) + 1)
  const most = Math.max(...sizes.values())
  const colors = picked.every((t) => kindOf(t.name)?.id === 'color')

  // 색 11개면 50~950, 10개면 50~900, 그 밖의 색은 100부터 100씩, 색이 아니면 1부터 1씩이 기본이다.
  const [start, setStart] = useState(String(!colors ? 1 : most === 11 || most === 10 ? 50 : 100))
  const [end, setEnd] = useState(String(!colors ? most : most === 11 ? 950 : most === 10 ? 900 : most * 100))

  const from = Number(start)
  const to = Number(end)
  const numeric = (s: string, n: number) => s.trim() !== '' && Number.isInteger(n) && n >= 0
  const valid = numeric(start, from) && numeric(end, to) && to >= from
  // 칸마다 그 칸의 까닭을 적는다. 시작 번호가 비었는데 끝 번호 칸에 "크게"라고 적지 않는다.
  const startError = numeric(start, from) ? null : '숫자를 입력해 주세요.'
  const endError = !numeric(end, to) ? '숫자를 입력해 주세요.' : !startError && to < from ? '시작 번호보다 작을 수 없어요.' : null

  const order = new Map<string, number>()
  const rows = parts.map((p) => {
    const list = listOf(p)
    const i = order.get(list) ?? 0
    order.set(list, i + 1)
    const n = valid ? numbers(sizes.get(list)!, from, to)[i] : null
    const next = n === null ? p.short : p.group ? `${p.group}-${n}` : String(n)
    return { old: p.old, short: p.short, next, full: p.prefix + next }
  })

  // 바꾼 뒤의 이름이 서로 또는 남아 있는 값과 겹치지 않는지 본다.
  const others = new Set(allNames.filter((n) => !picked.some((t) => t.name === n)))
  const seen = new Map<string, number>()
  for (const r of rows) seen.set(r.full, (seen.get(r.full) ?? 0) + 1)
  const problemOf = (r: (typeof rows)[number]) =>
    !SLUG.test(r.next) ? '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.' : others.has(r.full) || seen.get(r.full)! > 1 ? '같은 이름이 이미 있어요.' : null
  const changed = rows.some((r) => r.full !== r.old)
  const ready = valid && changed && rows.every((r) => problemOf(r) === null)

  return (
    <Modal title={`번호 ${picked.length}개 다시 매기기`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) onApply(Object.fromEntries(rows.filter((r) => r.full !== r.old).map((r) => [r.old, r.full])))
        }}
      >
        <div className="grid grid-cols-2 gap-field-row">
          <Field label="시작 번호" error={startError}>
            <input autoFocus className={inputClass} inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="끝 번호" error={endError}>
            <input className={inputClass} inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>

        <ul className="mt-fields max-h-[280px] space-y-rows overflow-y-auto rounded-card border-edge border-hairline p-box">
          {rows.map((r) => {
            const problem = problemOf(r)
            return (
              <li key={r.old} className="flex items-baseline gap-row-inner type-code">
                <span className="min-w-0 flex-1 truncate text-ink-faint">{r.short}</span>
                <span className="shrink-0 text-ink-faint">→</span>
                <span className={`min-w-0 flex-1 truncate ${problem ? 'text-danger' : r.full === r.old ? 'text-ink-faint' : 'text-ink'}`}>
                  {r.next}
                </span>
                {problem && <span className="shrink-0 type-body text-danger">{problem}</span>}
              </li>
            )
          })}
        </ul>

        <div className="mt-dialog-actions flex justify-end gap-actions">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" type="submit" disabled={!ready}>
            바꾸기
          </Button>
        </div>
      </form>
    </Modal>
  )
}
