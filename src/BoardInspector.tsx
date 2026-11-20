import { ICON_STROKE } from './lib/icons'
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
import { BOARD_DEFAULTS, NOTE_SIZES, type BoardStyle, type NoteSize, type Pos } from './lib/api'
import { asHex } from './lib/color'
import { arrange, gapOf, setGap, type Arrange, type Placed } from './lib/arrange'
import { ColorSwatch } from './ColorPicker'
import { Section } from './Inspector'
import { Segmented, monoInputClass } from './ui'

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
/** 판의 숫자 칸이 받는 꼴. 정수나 소수다. */
const WHOLE = /^-?\d+(\.\d+)?$/
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
    // 숫자 꼴만 받는다. 적다 만 꼴(5.)이나 1e3, 0x10 같은 것은 값이 아니다. 값이 같으면(016과 16) 저장하지 않는다(DESIGN.md field-rules).
    const next = Number(draft.trim())
    if (!WHOLE.test(draft.trim()) || next === Number(shown)) return setDraft(shown)
    onCommit?.(next)
  }

  return (
    // 이름표와 숫자를 한 칸 안에 나란히 둔다. 이름표가 길어도 숫자와 겹치지 않는다.
    <label
      title={label}
      className={`flex h-control min-w-0 items-center gap-row-inner rounded-control border-edge border-hairline px-input-x focus-within:border-selection ${draft.trim() !== '' && !/^-?\d*\.?\d*$/.test(draft.trim()) ? 'border-danger! focus-within:border-danger!' : ''} ${
        readOnly ? 'bg-hover' : 'bg-canvas'
      }`}
    >
      <span
        className={`shrink-0 type-body text-ink-faint select-none ${fixed ? '' : 'cursor-ew-resize'}`}
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
        className={`min-w-0 flex-1 bg-transparent type-body tabular-nums! outline-none placeholder:text-ink-faint ${
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

/** 색 칸. 왼쪽 견본을 누르면 옆에 색 선택 창이 열리고, 오른쪽에는 #rrggbb를 직접 적는다. 그림자의 색 칸도 이것을 쓴다(placeholder는 값이 없을 때 칸에 옅게 보이는 말). */
export function ColorField({ label, value, placeholder = MIXED, onCommit }: { label: string; value: string | null; placeholder?: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value ?? '')
  // 색 선택 창에서 끄는 동안에도 창이 닫히지 않도록, 값이 바뀌면 칸을 새로 만들지 않고 적힌 글자만 맞춘다.
  useEffect(() => setDraft(value ?? ''), [value])

  function commit() {
    // #을 빼고 여섯 자리만 적어도 받는다.
    const next = asHex(draft) ?? ''
    if (!HEX6.test(next) || next === value) return setDraft(value ?? '')
    onCommit(next)
  }

  return (
    <span className="flex items-center gap-field-row">
      <ColorSwatch label={`${label} 고르기`} value={value} fallback="#ffffff" onChange={onCommit} />
      <input
        aria-label={label}
        // 색으로 읽히지 않는 값을 적는 동안은 빨갛게 한다. 그대로 벗어나면 저장된 값으로 되돌린다(DESIGN.md field-rules).
        className={`${monoInputClass} ${draft.trim() !== '' && !HEX6.test(asHex(draft) ?? '') ? 'border-danger! focus:border-danger!' : ''}`}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </span>
  )
}

/** 캔버스에 붙인 사진을 선택했을 때의 편집 패널. 너비를 고치면 높이는 비율대로 따라온다. */
export function ImageInspector({
  picked,
  mixed = false,
  onMove,
}: {
  picked: Placed[]
  /** 사진과 글을 함께 선택했는지. 그때는 제목에 "사진"이라고 세지 않는다(너비는 사진에만 먹는다). */
  mixed?: boolean
  onMove: (moves: Record<string, Partial<Pos>>) => void
}) {
  const many = picked.length > 1
  const all = (patch: Partial<Pos>) => onMove(Object.fromEntries(picked.map((b) => [b.id, patch])))
  return (
    <div>
      <Section>
        <h2 className="type-heading">{mixed ? `${picked.length}개 선택됨` : many ? `사진 ${picked.length}개 선택됨` : '사진'}</h2>
      </Section>
      <Section title="위치">
        <div className="grid grid-cols-2 gap-field-row">
          <NumberField tag="X" label="가로 위치" value={shared(picked.map((b) => b.x))} onCommit={(x) => all({ x })} />
          <NumberField tag="Y" label="세로 위치" value={shared(picked.map((b) => b.y))} onCommit={(y) => all({ y })} />
        </div>
      </Section>
      <Section title="크기">
        <div className="grid grid-cols-2 gap-field-row">
          <NumberField
            tag="W"
            label="너비"
            value={shared(picked.map((b) => b.w))}
            onCommit={(w) => all({ w: clamp(w, 16, 8000) })}
          />
          <NumberField tag="H" label="높이 (너비에 맞춰 정해져요)" value={shared(picked.map((b) => b.h))} readOnly />
        </div>
      </Section>
    </div>
  )
}

/** 캔버스에 적은 글을 선택했을 때의 편집 패널. 자리와 글의 크기만 있다. 글의 내용은 캔버스에서 더블클릭해 고친다. */
export function NoteInspector({
  picked,
  size,
  onMove,
  onSize,
}: {
  picked: Placed[]
  /** 선택한 글들의 크기. 서로 다르면 null. */
  size: NoteSize | null
  onMove: (moves: Record<string, Partial<Pos>>) => void
  onSize: (size: NoteSize) => void
}) {
  const many = picked.length > 1
  const all = (patch: Partial<Pos>) => onMove(Object.fromEntries(picked.map((b) => [b.id, patch])))
  return (
    <div>
      <Section>
        <h2 className="type-heading">{many ? `글 ${picked.length}개 선택됨` : '글'}</h2>
      </Section>
      <Section title="위치">
        <div className="grid grid-cols-2 gap-field-row">
          <NumberField tag="X" label="가로 위치" value={shared(picked.map((b) => b.x))} onCommit={(x) => all({ x })} />
          <NumberField tag="Y" label="세로 위치" value={shared(picked.map((b) => b.y))} onCommit={(y) => all({ y })} />
        </div>
      </Section>
      <Section title="글자 크기">
        {/* 크기가 서로 다른 글을 함께 골랐으면 고른 칸이 없다. 하나를 누르면 모두 그 크기가 된다. */}
        <Segmented label="글자 크기" options={NOTE_SIZES} value={(size ?? '') as NoteSize} onChange={onSize} />
      </Section>
    </div>
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
    'flex size-icon-button shrink-0 items-center justify-center rounded-control text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-focus'

  return (
    <div>
      <Section>
        <div className="flex items-center gap-actions-tight">
          <h2 className="min-w-0 flex-1 truncate type-heading">{many ? `판 ${picked.length}개 선택됨` : `${titles[picked[0].id]} 판`}</h2>
          <button
            type="button"
            title={locked ? '잠금 풀기 (Ctrl+Shift+L)' : '잠그기 (Ctrl+Shift+L)'}
            aria-label={locked ? '잠금 풀기' : '잠그기'}
            aria-pressed={locked}
            onClick={() => all(() => ({ locked: !locked }))}
            className={`${TOOL} ${locked ? 'bg-hover text-ink' : ''}`}
          >
            {locked ? <Lock size={16} strokeWidth={ICON_STROKE} /> : <LockOpen size={16} strokeWidth={ICON_STROKE} />}
          </button>
          <button
            type="button"
            title="숨기기 (Ctrl+Shift+H) · 왼쪽 메뉴에서 다시 보이게 할 수 있어요"
            aria-label="숨기기"
            onClick={() => all(() => ({ hidden: true }))}
            className={TOOL}
          >
            <Eye size={16} strokeWidth={ICON_STROKE} />
          </button>
        </div>
      </Section>

      <Section title="위치">
        <p className="mb-label type-label text-ink-faint">정렬</p>
        <div className="mb-fields flex gap-actions-tight">
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
              className={`flex size-icon-button items-center justify-center rounded-control text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-disabled ${i === 3 ? 'ml-blocks' : ''}`}
            >
              <Icon size={16} strokeWidth={ICON_STROKE} />
            </button>
          ))}
        </div>
        <p className="mb-label type-label text-ink-faint">위치</p>
        <div className="grid grid-cols-2 gap-field-row">
          <NumberField tag="X" label="가로 위치" value={x} readOnly={anyLocked} onCommit={(v) => all(() => ({ x: v }))} />
          <NumberField tag="Y" label="세로 위치" value={y} readOnly={anyLocked} onCommit={(v) => all(() => ({ y: v }))} />
        </div>
      </Section>

      <Section title="배치">
        <p className="mb-label type-label text-ink-faint">크기</p>
        <div className="grid grid-cols-2 gap-field-row">
          <NumberField
            tag="W"
            label="너비 (판마다 정해져 있어요)"
            value={w}
            readOnly
          />
          <NumberField tag="H" label="높이 (내용에 따라 정해져요)" value={h} readOnly />
        </div>
        {many && (
          <>
            <p className="mt-fields mb-label type-label text-ink-faint">간격</p>
            <div className="grid grid-cols-2 gap-field-row">
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
        <div className="grid grid-cols-2 gap-field-row">
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
        <div className="space-y-blocks">
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
