import { useState } from 'react'

/** 그 자리에서 이름을 고치는 작업 하나. rect는 원래 이름이 적혀 있던 자리. */
export type Renaming = {
  rect: DOMRect
  value: string
  /** 쓸 수 없는 이름이면 이유를 돌려준다. */
  check: (next: string) => string | null
  commit: (next: string) => void
}

/** 이름 위에 겹쳐 뜨는 입력칸. Enter나 바깥을 누르면 반영하고 Esc는 취소한다. */
export function RenameBox({ job, onClose }: { job: Renaming; onClose: () => void }) {
  const [draft, setDraft] = useState(job.value)
  const [error, setError] = useState<string | null>(null)

  function finish(strict: boolean) {
    const next = draft.trim()
    if (next === job.value) return onClose()
    const problem = next ? job.check(next) : '이름을 입력해 주세요.'
    // 바깥을 눌러 닫을 때는 잘못된 이름을 버리고, Enter로 확인할 때는 이유를 보여 준다.
    if (problem) return strict ? setError(problem) : onClose()
    job.commit(next)
    onClose()
  }

  return (
    <div
      className="fixed z-40"
      style={{ left: job.rect.left - 9, top: job.rect.top + job.rect.height / 2 - 16, width: Math.max(160, job.rect.width + 32) }}
    >
      <input
        autoFocus
        aria-label="이름"
        className={`h-8 w-full rounded-md border bg-canvas px-2 text-sm text-ink shadow-float outline-none ${
          error ? 'border-danger' : 'border-selection'
        }`}
        value={draft}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(null)
        }}
        onBlur={() => finish(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true)
          else if (e.key === 'Escape') onClose()
        }}
      />
      {error && (
        <span className="mt-1 block rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-danger shadow-float">
          {error}
        </span>
      )}
    </div>
  )
}
