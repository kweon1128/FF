import { useState } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  type LucideIcon,
} from 'lucide-react'
import type { Pos } from './lib/api'
import { arrange, gapOf, setGap, type Arrange, type Placed } from './lib/arrange'
import { Section } from './Inspector'
import { inputClass } from './ui'

export const MIN_BOARD_WIDTH = 240
export const MAX_BOARD_WIDTH = 1600

const MIXED = '서로 다름'

const ALIGN: { action: Arrange; label: string; icon: LucideIcon }[] = [
  { action: 'left', label: '왼쪽 정렬 (Alt+A)', icon: AlignStartVertical },
  { action: 'centerX', label: '가로 가운데 정렬 (Alt+H)', icon: AlignCenterVertical },
  { action: 'right', label: '오른쪽 정렬 (Alt+D)', icon: AlignEndVertical },
  { action: 'top', label: '위쪽 정렬 (Alt+W)', icon: AlignStartHorizontal },
  { action: 'centerY', label: '세로 가운데 정렬 (Alt+V)', icon: AlignCenterHorizontal },
  { action: 'bottom', label: '아래쪽 정렬 (Alt+S)', icon: AlignEndHorizontal },
]

/** 선택한 판들의 값이 모두 같으면 그 값, 아니면 null. */
const shared = (values: number[]) => (values.every((v) => v === values[0]) ? values[0] : null)

/**
 * 앞에 짧은 이름표(X, Y, W 등)가 붙은 숫자 칸. 칸을 벗어나거나 Enter를 누르면 반영한다.
 * 값이 서로 다르면 비워 두고 "서로 다름"을 보여준다.
 */
function NumberField({
  tag,
  label,
  value,
  readOnly,
  onCommit,
}: {
  tag: string
  label: string
  value: number | null
  readOnly?: boolean
  onCommit?: (value: number) => void
}) {
  const shown = value === null ? '' : String(Math.round(value))
  const [draft, setDraft] = useState(shown)

  function commit() {
    const next = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(next) || draft === shown) return setDraft(shown)
    onCommit?.(next)
  }

  return (
    <label className="relative block min-w-0" title={label}>
      <span className="pointer-events-none absolute top-0 left-2 flex h-8 items-center text-xs text-ink-faint">{tag}</span>
      <input
        aria-label={label}
        inputMode="numeric"
        className={`${inputClass} pl-9 tabular-nums ${readOnly ? 'bg-hover text-ink-soft' : ''}`}
        value={draft}
        placeholder={MIXED}
        readOnly={readOnly}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  )
}

/** 전체 보기에서 판을 선택했을 때의 편집 패널. 구역은 피그마와 같이 위치, 배치로 나눈다. */
export function BoardInspector({
  picked,
  titles,
  onMove,
}: {
  picked: Placed[]
  titles: Record<string, string>
  onMove: (moves: Record<string, Partial<Pos>>) => void
}) {
  const many = picked.length > 1
  const all = (patch: (b: Placed) => Partial<Pos>) => onMove(Object.fromEntries(picked.map((b) => [b.id, patch(b)])))

  const x = shared(picked.map((b) => b.x))
  const y = shared(picked.map((b) => b.y))
  const w = shared(picked.map((b) => b.w))
  const h = shared(picked.map((b) => b.h))
  const gapX = gapOf('x', picked)
  const gapY = gapOf('y', picked)

  return (
    <div>
      <Section>
        <h2 className="font-[650]">{many ? `판 ${picked.length}개 선택됨` : `${titles[picked[0].id]} 판`}</h2>
      </Section>

      <Section title="위치">
        <p className="mb-1 text-xs font-[550] text-ink-faint">정렬</p>
        <div className="mb-3 flex gap-0.5">
          {ALIGN.map(({ action, label, icon: Icon }, i) => (
            <button
              key={action}
              type="button"
              title={many ? label : `${label} · 판을 2개 이상 선택하면 쓸 수 있어요`}
              aria-label={label}
              disabled={!many}
              onClick={() => {
                const moves = arrange(action, picked)
                if (moves) onMove(moves)
              }}
              className={`flex size-8 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-40 ${i === 3 ? 'ml-2' : ''}`}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          ))}
        </div>
        <p className="mb-1 text-xs font-[550] text-ink-faint">위치</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField key={`x${x}`} tag="X" label="가로 위치" value={x} onCommit={(v) => all(() => ({ x: v }))} />
          <NumberField key={`y${y}`} tag="Y" label="세로 위치" value={y} onCommit={(v) => all(() => ({ y: v }))} />
        </div>
      </Section>

      <Section title="배치">
        <p className="mb-1 text-xs font-[550] text-ink-faint">크기</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            key={`w${w}`}
            tag="W"
            label={`너비 (${MIN_BOARD_WIDTH}~${MAX_BOARD_WIDTH})`}
            value={w}
            onCommit={(v) => all(() => ({ w: Math.min(MAX_BOARD_WIDTH, Math.max(MIN_BOARD_WIDTH, Math.round(v))) }))}
          />
          <NumberField key={`h${h}`} tag="H" label="높이 (내용에 따라 정해져요)" value={h} readOnly />
        </div>
        {many && (
          <>
            <p className="mt-3 mb-1 text-xs font-[550] text-ink-faint">간격</p>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                key={`gx${gapX}`}
                tag="가로"
                label="가로 간격"
                value={gapX}
                onCommit={(v) => onMove(setGap('x', v, picked))}
              />
              <NumberField
                key={`gy${gapY}`}
                tag="세로"
                label="세로 간격"
                value={gapY}
                onCommit={(v) => onMove(setGap('y', v, picked))}
              />
            </div>
          </>
        )}
      </Section>
    </div>
  )
}
