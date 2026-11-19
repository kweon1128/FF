import { useState } from 'react'
import type { Token } from './lib/api'
import { Button, Check, Modal, Segmented } from './ui'

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
      {/* 창 안 어디에서 Enter를 눌러도 붙여넣는다(다른 창과 같다). 전환 버튼이나 체크박스를 누른 뒤에도 듣는다. */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (total > 0) onPaste({ overwrite, adopt })
        }}
        // 전환 버튼의 칸에 초점이 있을 때의 Enter는 그 칸을 다시 누를 뿐이라 창이 내지지 않는다. 여기서 받아 낸다.
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || (e.target as HTMLElement).getAttribute('role') !== 'radio') return
          e.preventDefault()
          e.currentTarget.requestSubmit()
        }}
      >
      <div className="space-y-settings">
        <p className="text-ink-soft">
          값 <span className="type-label text-ink">{total}개</span>를 붙여넣어요.
        </p>

        {job.conflicts > 0 && (
          <div>
            <p className="mb-label type-label text-ink-faint">이름이 같은 값 {job.conflicts}개</p>
            <Segmented
              label="이름이 같은 값"
              options={[
                { id: 'over', label: '덮어쓰기' },
                { id: 'keep', label: '따로 만들기' },
              ]}
              value={overwrite ? 'over' : 'keep'}
              onChange={(next) => setOverwrite(next === 'over')}
            />
          </div>
        )}

        {job.skipped.length > 0 && (
          <div>
            <p className="mb-label type-label text-ink-faint">읽지 못한 값 {job.skipped.length}개</p>
            <ul className="max-h-[144px] space-y-rows overflow-y-auto rounded-card border-edge border-hairline p-box">
              {job.skipped.map((t) => (
                <li key={t.name} className="flex items-baseline gap-row-inner type-code-sm">
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="max-w-[45%] shrink-0 truncate text-ink-faint">{t.value}</span>
                </li>
              ))}
            </ul>
            {job.adoptable.length > 0 && (
              <div className="mt-blocks">
                <Check checked={adopt} onChange={setAdopt}>
                  색으로 보이는 {job.adoptable.length}개는 이름 앞에 <span className="type-code-sm">--color-</span>를 붙여 가져오기
                </Check>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-dialog-actions flex justify-end gap-actions">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit" disabled={total === 0}>
          붙여넣기
        </Button>
      </div>
      </form>
    </Modal>
  )
}
