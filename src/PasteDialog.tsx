import { useState } from 'react'
import type { Token } from './lib/api'
import { Button, Check, Modal } from './ui'

/** 붙여넣기 전에 정해야 할 것이 있을 때 넘겨받는 내용. */
export type PasteJob = {
  /** FF가 읽은 값들. */
  pasted: Token[]
  /** 그중 이름이 이미 있는 값의 수. */
  conflicts: number
  /** FF가 아는 종류가 아니라서 읽지 못한 선언들. */
  skipped: Token[]
  /** 읽지 못한 것 중 색으로 보이는 것을 --color- 이름으로 바꾼 것. */
  adoptable: Token[]
  /** 색을 넣을 목록(색을 선택해 둔 채 붙였을 때). */
  into: string | null
}

const OPTION = 'h-7 flex-1 rounded-sm text-sm leading-none font-[550] outline-selection focus-visible:outline-2'

/**
 * 붙여넣기 창. 이름이 같은 값이 있거나 읽지 못한 값이 있을 때만 뜬다.
 * 같은 이름을 덮어쓸지 따로 만들지 고르고, 읽지 못한 값이 무엇인지 보여 준다.
 */
export function PasteDialog({
  job,
  onPaste,
  onCancel,
}: {
  job: PasteJob
  onPaste: (choice: { overwrite: boolean; adopt: boolean }) => void
  onCancel: () => void
}) {
  // AI가 고친 것을 다시 붙이는 경우가 많으므로 덮어쓰기가 기본이다.
  const [overwrite, setOverwrite] = useState(true)
  const [adopt, setAdopt] = useState(true)
  const total = job.pasted.length + (adopt ? job.adoptable.length : 0)

  return (
    <Modal title="붙여넣기" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-ink-soft">
          값 <span className="font-[550] text-ink">{total}개</span>를 붙여넣어요.
        </p>

        {job.conflicts > 0 && (
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">이름이 같은 값 {job.conflicts}개</p>
            <div role="group" aria-label="이름이 같은 값" className="flex rounded-md bg-hover p-0.5">
              {[
                { on: true, label: '덮어쓰기' },
                { on: false, label: '따로 만들기' },
              ].map(({ on, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={overwrite === on}
                  onClick={() => setOverwrite(on)}
                  className={`${OPTION} ${overwrite === on ? 'border border-hairline bg-canvas text-ink' : 'text-ink-soft hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {job.skipped.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">읽지 못한 값 {job.skipped.length}개</p>
            <ul className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-hairline p-2">
              {job.skipped.map((t) => (
                <li key={t.name} className="flex items-baseline gap-2 font-mono text-xs">
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="max-w-[45%] shrink-0 truncate text-ink-faint">{t.value}</span>
                </li>
              ))}
            </ul>
            {job.adoptable.length > 0 && (
              <div className="mt-2">
                <Check checked={adopt} onChange={setAdopt}>
                  색으로 보이는 {job.adoptable.length}개는 이름 앞에 <span className="font-mono text-xs">--color-</span>를 붙여 가져오기
                </Check>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" disabled={total === 0} onClick={() => onPaste({ overwrite, adopt })}>
          붙여넣기
        </Button>
      </div>
    </Modal>
  )
}
