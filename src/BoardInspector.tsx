import { useEffect, useRef, useState } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Eye,
  Lock,
  LockOpen,
  type LucideIcon,
} from 'lucide-react'
import { BOARD_DEFAULTS, type BoardStyle, type Pos } from './lib/api'
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
const shared = <T,>(values: T[]) => (values.every((v) => v === values[0]) ? values[0] : null)

const HEX6 = /^#[0-9a-f]{6}$/i
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

/**
 * 앞에 짧은 이름표(X, Y, W 등)가 붙은 숫자 칸. 칸을 벗어나거나 Enter를 누르면 반영한다.
 * ↑↓는 1씩(Shift는 10씩) 바꾸고, 이름표를 좌우로 끌면 끈 만큼 값이 바뀐다.
 * 값이 서로 다르면 비워 두고 "서로 다름"을 보여준다.
 */
export function NumberField({
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
  // 값이 밖에서 바뀌면(끌기, 되돌리기) 칸을 새로 만들지 않고 적힌 글자만 맞춘다.
  useEffect(() => setDraft(shown), [shown])
  const scrub = useRef<{ x: number; from: number } | null>(null)
  const fixed = readOnly || value === null || !onCommit

  function commit() {
    const next = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(next) || draft === shown) return setDraft(shown)
    onCommit?.(next)
  }

  return (
    // 이름표와 숫자를 한 칸 안에 나란히 둔다. 이름표가 길어도 숫자와 겹치지 않는다.
    <label
      title={label}
      className={`flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-hairline px-2 focus-within:border-selection ${
        readOnly ? 'bg-hover' : 'bg-canvas'
      }`}
    >
      <span
        className={`shrink-0 text-xs text-ink-faint select-none ${fixed ? '' : 'cursor-ew-resize'}`}
        onPointerDown={(e) => {
          if (fixed) return
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          scrub.current = { x: e.clientX, from: value }
        }}
        onPointerMove={(e) => {
          const s = scrub.current
          if (!s) return
          const next = s.from + Math.round(e.clientX - s.x) * (e.shiftKey ? 10 : 1)
          if (next !== value) onCommit?.(next)
        }}
        onPointerUp={() => (scrub.current = null)}
        onPointerCancel={() => (scrub.current = null)}
      >
        {tag}
      </span>
      <input
        aria-label={label}
        inputMode="numeric"
        className={`min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none placeholder:text-ink-faint ${
          readOnly ? 'text-ink-soft' : 'text-ink'
        }`}
        value={draft}
        placeholder={MIXED}
        readOnly={readOnly}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') return e.currentTarget.blur()
          if (fixed || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
          e.preventDefault()
          const from = Number.isFinite(Number(draft)) && draft.trim() !== '' ? Number(draft) : value
          onCommit?.(from + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1))
        }}
      />
    </label>
  )
}

/** 색 칸. 왼쪽 견본을 누르면 색 선택 창이 열리고, 오른쪽에는 #rrggbb를 직접 적는다. */
function ColorField({ label, value, onCommit }: { label: string; value: string | null; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value ?? '')
  // 색 선택 창에서 끄는 동안에도 창이 닫히지 않도록, 값이 바뀌면 칸을 새로 만들지 않고 적힌 글자만 맞춘다.
  useEffect(() => setDraft(value ?? ''), [value])

  function commit() {
    const next = draft.trim().toLowerCase()
    if (!HEX6.test(next) || next === value) return setDraft(value ?? '')
    onCommit(next)
  }

  return (
    <span className="flex items-center gap-2">
      <span
        className="relative size-8 shrink-0 overflow-hidden rounded-md border border-hairline focus-within:border-selection"
        style={{ background: value ?? undefined }}
      >
        <input
          type="color"
          aria-label={`${label} 고르기`}
          value={value ?? '#ffffff'}
          onChange={(e) => onCommit(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </span>
      <input
        aria-label={label}
        className={`${inputClass} font-mono`}
        value={draft}
        placeholder={MIXED}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </span>
  )
}

/** 전체 보기에서 판을 선택했을 때의 편집 패널. 구역은 피그마와 같이 위치, 배치, 모양, 채우기, 테두리로 나눈다. */
export function BoardInspector({
  picked,
  styles,
  titles,
  onMove,
}: {
  picked: Placed[]
  /** 판마다 고친 모양. 고치지 않은 값은 기본 모양을 따른다. */
  styles: Record<string, BoardStyle | undefined>
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
  const look = <K extends keyof BoardStyle>(key: K) =>
    shared(picked.map((b) => styles[b.id]?.[key] ?? BOARD_DEFAULTS[key]))
  const opacity = look('opacity')
  const radius = look('radius')
  const fill = look('fill')
  const stroke = look('stroke')
  const strokeWidth = look('strokeWidth')
  const locked = picked.every((b) => styles[b.id]?.locked)
  const anyLocked = picked.some((b) => styles[b.id]?.locked)
  const TOOL =
    'flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2'

  return (
    <div>
      <Section>
        <div className="flex items-center">
          <h2 className="min-w-0 flex-1 truncate font-[650]">{many ? `판 ${picked.length}개 선택됨` : `${titles[picked[0].id]} 판`}</h2>
          <button
            type="button"
            title={locked ? '잠금 풀기 (Ctrl+Shift+L)' : '잠그기 (Ctrl+Shift+L)'}
            aria-label={locked ? '잠금 풀기' : '잠그기'}
            aria-pressed={locked}
            onClick={() => all(() => ({ locked: !locked }))}
            className={`${TOOL} ${locked ? 'bg-hover text-ink' : ''}`}
          >
            {locked ? <Lock size={16} strokeWidth={1.5} /> : <LockOpen size={16} strokeWidth={1.5} />}
          </button>
          <button
            type="button"
            title="숨기기 (Ctrl+Shift+H) · 왼쪽 메뉴에서 다시 보이게 할 수 있어요"
            aria-label="숨기기"
            onClick={() => all(() => ({ hidden: true }))}
            className={TOOL}
          >
            <Eye size={16} strokeWidth={1.5} />
          </button>
        </div>
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
              disabled={!many || anyLocked}
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
          <NumberField tag="X" label="가로 위치" value={x} readOnly={anyLocked} onCommit={(v) => all(() => ({ x: v }))} />
          <NumberField tag="Y" label="세로 위치" value={y} readOnly={anyLocked} onCommit={(v) => all(() => ({ y: v }))} />
        </div>
      </Section>

      <Section title="배치">
        <p className="mb-1 text-xs font-[550] text-ink-faint">크기</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            tag="W"
            label={`너비 (${MIN_BOARD_WIDTH}~${MAX_BOARD_WIDTH})`}
            value={w}
            onCommit={(v) => all(() => ({ w: Math.min(MAX_BOARD_WIDTH, Math.max(MIN_BOARD_WIDTH, Math.round(v))) }))}
          />
          <NumberField tag="H" label="높이 (내용에 따라 정해져요)" value={h} readOnly />
        </div>
        {many && (
          <>
            <p className="mt-3 mb-1 text-xs font-[550] text-ink-faint">간격</p>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                tag="가로"
                label="가로 간격"
                value={gapX}
                onCommit={(v) => onMove(setGap('x', v, picked))}
              />
              <NumberField
                tag="세로"
                label="세로 간격"
                value={gapY}
                onCommit={(v) => onMove(setGap('y', v, picked))}
              />
            </div>
          </>
        )}
      </Section>

      <Section title="모양">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            tag="%"
            label="투명도 (0~100)"
            value={opacity}
            onCommit={(v) => all(() => ({ opacity: clamp(v, 0, 100) }))}
          />
          <NumberField
            tag="모서리"
            label="모서리 둥글기"
            value={radius}
            onCommit={(v) => all(() => ({ radius: clamp(v, 0, 999) }))}
          />
        </div>
      </Section>

      <Section title="채우기">
        <ColorField label="채우기 색" value={fill} onCommit={(v) => all(() => ({ fill: v }))} />
      </Section>

      <Section title="테두리">
        <div className="space-y-2">
          <ColorField label="테두리 색" value={stroke} onCommit={(v) => all(() => ({ stroke: v }))} />
          <NumberField
            tag="굵기"
            label="테두리 굵기 (0~20)"
            value={strokeWidth}
            onCommit={(v) => all(() => ({ strokeWidth: clamp(v, 0, 20) }))}
          />
        </div>
      </Section>
    </div>
  )
}
