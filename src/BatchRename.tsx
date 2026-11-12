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
 * 여러 값의 번호를 한꺼번에 다시 매기는 창(Ctrl+R).
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
  const valid = start.trim() !== '' && end.trim() !== '' && Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= from

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
    !SLUG.test(r.next) ? '쓸 수 없는 이름' : others.has(r.full) || seen.get(r.full)! > 1 ? '같은 이름이 있음' : null
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
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작 번호">
            <input autoFocus className={inputClass} inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="끝 번호" error={valid ? null : '시작 번호보다 크게'}>
            <input className={inputClass} inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>

        <ul className="mt-3 max-h-[280px] space-y-1 overflow-y-auto rounded-md border border-hairline p-2">
          {rows.map((r) => {
            const problem = problemOf(r)
            return (
              <li key={r.old} className="flex items-baseline gap-2 font-mono text-sm">
                <span className="min-w-0 flex-1 truncate text-ink-faint">{r.short}</span>
                <span className="shrink-0 text-ink-faint">→</span>
                <span className={`min-w-0 flex-1 truncate ${problem ? 'text-danger' : r.full === r.old ? 'text-ink-faint' : 'text-ink'}`}>
                  {r.next}
                </span>
                {problem && <span className="shrink-0 font-sans text-danger">{problem}</span>}
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex justify-end gap-2">
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
