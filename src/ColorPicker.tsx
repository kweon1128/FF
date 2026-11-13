// 색 선택 창. 브라우저의 기본 창 대신 FF의 모양에 맞춰 직접 그린다.
// 위에서부터 채도·밝기 면, 스포이드와 색조 막대, (투명도 막대), 색 값 입력칸, 이 디자인 시스템의 색 견본.

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Pipette } from 'lucide-react'
import { ColorUses } from './ColorUses'
import { swatchBackground } from './ui'

/** #rrggbb 또는 투명도가 붙은 #rrggbbaa */
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i
const WIDTH = 248
const GAP = 8

/** 색 선택 창 아래에 견본으로 보여 줄 색들(이 디자인 시스템의 색). 목록마다 한 줄이다. App이 넣어 준다. */
export type SwatchRow = { group: string; colors: { name: string; hex: string }[] }
export const SwatchContext = createContext<SwatchRow[]>([])

type Hsv = { h: number; s: number; v: number }

function hexToHsv(hex: string): Hsv {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: h * 60, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
/** 색 값에서 투명도(0~1)를 읽는다. 여섯 자리면 1. */
const alphaOf = (hex: string) => (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1)
/** 색(#rrggbb)에 투명도를 붙인다. 불투명이면 여섯 자리 그대로 둔다. */
const withAlpha = (rgb: string, alpha: number) =>
  alpha >= 1 ? rgb : `${rgb}${Math.round(clamp01(alpha) * 255).toString(16).padStart(2, '0')}`
/** 적거나 붙여넣은 글자에서 #과 그 밖의 글자를 빼고 16진수 여섯 자리까지만 남긴다. */
const cleanDigits = (text: string) => text.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6)
const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper

/** 끌어서 값을 바꾸는 면이나 막대. 누른 자리의 가로·세로 비율(0~1)을 알려 준다. */
function useDrag(onMove: (x: number, y: number) => void) {
  const report = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onMove(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height))
  }
  return {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      report(e)
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) report(e)
    },
  }
}

// 손잡이: 피그마처럼 두꺼운 흰 고리에 가운데로 그 자리의 색이 보인다. 옅은 그림자로 밝은 색 위에서도 보이게 한다.
const KNOB =
  'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_0_0_0.5px_rgb(0_0_0/0.25),0_1px_3px_rgb(0_0_0/0.35)]'
const FIELD = 'h-8 min-w-0 rounded-md border border-hairline bg-canvas px-2 font-mono text-sm outline-none focus:border-selection'

function Panel({
  anchor,
  opener,
  value,
  alpha: allowAlpha,
  preview,
  onChange,
  onClose,
}: {
  anchor: DOMRect
  /** 이 창을 연 견본. 다시 누르면 견본이 직접 닫으므로 바깥 누르기로 치지 않는다. */
  opener: HTMLElement | null
  /** #rrggbb 또는 #rrggbbaa */
  value: string
  /** 투명도를 고를 수 있는지. 아니면 항상 불투명한 #rrggbb만 낸다. */
  alpha: boolean
  /** 고르는 색이 실제로 쓰인 모습을 창 안에 함께 보여 줄지. 끄는 동안 바로 따라 바뀐다. */
  preview: boolean
  onChange: (hex: string) => void
  onClose: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const all = useContext(SwatchContext)
  // 투명도를 받지 않는 자리에서는 반투명한 색을 뺀다. 그래서 비게 된 줄은 보여 주지 않는다.
  const swatches = all
    .map((row) => ({ ...row, colors: (row.colors ?? []).filter((c) => allowAlpha || c.hex.length === 7) }))
    .filter((row) => row.colors.length > 0)
  const rgb = value.slice(0, 7)
  const a = allowAlpha ? alphaOf(value) : 1
  // 색조는 따로 들고 있는다. 회색이나 검정으로 가도 고르던 색조가 빨강으로 튀지 않게 한다.
  const [picked, setPicked] = useState(() => ({ hsv: hexToHsv(rgb), rgb }))
  // 밖에서 색이 바뀌었으면(견본, 직접 적기, 되돌리기) 그 색에 맞춘다. 끌어서 낸 색이면 고르던 자리를 그대로 둔다.
  // 그리는 도중에 바로 맞춘다. 그린 뒤에 맞추면 빠르게 끌 때 한 박자 늦게 실행되어 손잡이가 예전 자리로 돌아간다.
  if (picked.rgb !== rgb) setPicked({ hsv: hsvToHex(picked.hsv) === rgb ? picked.hsv : hexToHsv(rgb), rgb })
  const hsv = picked.hsv
  const [draft, setDraft] = useState(rgb.slice(1))
  const [percent, setPercent] = useState(String(Math.round(a * 100)))
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // 밖에서 값이 바뀌면 입력칸에 적힌 글자도 따라간다.
  useEffect(() => {
    setDraft(rgb.slice(1))
    setPercent(String(Math.round(a * 100)))
  }, [rgb, a])

  // 견본의 왼쪽에 놓고, 자리가 없으면 오른쪽에 놓는다. 화면 밖으로 나가지 않게 한다.
  useLayoutEffect(() => {
    const h = box.current?.offsetHeight ?? 0
    const left = anchor.left - WIDTH - GAP >= GAP ? anchor.left - WIDTH - GAP : Math.min(anchor.right + GAP, window.innerWidth - WIDTH - GAP)
    setPos({ left, top: Math.max(GAP, Math.min(anchor.top - 12, window.innerHeight - h - GAP)) })
  }, [anchor])

  // 스포이드: 화면에서 색을 찍는다. 찍는 동안에는 화면을 눌러도 이 창을 닫지 않는다.
  const picking = useRef(false)
  const drop = useRef(() => {})
  drop.current = () => {
    if (!EyeDropper || picking.current) return
    picking.current = true
    new EyeDropper()
      .open()
      .then((r) => onChange(withAlpha(r.sRGBHex.toLowerCase().slice(0, 7), a)))
      .catch(() => {}) // Esc로 그만둔 경우
      .finally(() => (picking.current = false))
  }

  useEffect(() => {
    const down = (e: globalThis.PointerEvent) => {
      const target = e.target as Node
      if (!picking.current && !box.current?.contains(target) && !opener?.contains(target)) onClose()
    }
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement
      // I: 이 창이 열려 있으면 어디서든(확인 창 안에서도) 스포이드를 켠다.
      if (e.code === 'KeyI' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return drop.current()
      }
      if (e.key !== 'Escape') return
      // 확인 창 안에서 열렸을 때 Esc가 확인 창까지 닫지 않게 여기서 멈춘다.
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('keydown', key, true)
    return () => {
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('keydown', key, true)
    }
  }, [onClose, opener])

  function pick(next: Hsv) {
    const hex = hsvToHex(next)
    setPicked({ hsv: next, rgb: hex })
    onChange(withAlpha(hex, a))
  }

  const area = useDrag((x, y) => pick({ ...hsv, s: x, v: 1 - y }))
  const hue = useDrag((x) => pick({ ...hsv, h: x * 360 }))
  const fade = useDrag((x) => onChange(withAlpha(rgb, Math.round(x * 100) / 100)))

  // 견본이 놓인 자리(이름표 안, 확인 창 안)와 얽히지 않도록 문서의 맨 바깥에 그린다.
  // 이름표 안에 그리면 창을 누를 때마다 이름표가 견본을 대신 눌러 창이 닫힌다.
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label="색 선택"
      className="fixed z-[60] rounded-lg border border-hairline bg-canvas p-3 shadow-dialog"
      style={{ width: WIDTH, left: pos?.left ?? -9999, top: pos?.top ?? 0 }}
    >
      <div
        {...area}
        data-color-area
        className="relative h-36 touch-none rounded-md"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
      >
        <span className={KNOB} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: rgb }} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        {EyeDropper && (
          <button
            type="button"
            title="화면에서 색 찍기 (I)"
            aria-label="화면에서 색 찍기"
            onClick={() => drop.current()}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2"
          >
            <Pipette size={16} strokeWidth={1.5} />
          </button>
        )}
        <div className="min-w-0 flex-1 space-y-2.5">
          <div
            {...hue}
            role="slider"
            aria-label="색조"
            aria-valuenow={Math.round(hsv.h)}
            aria-valuemin={0}
            aria-valuemax={360}
            className="relative h-3 touch-none rounded-full"
            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          >
            <span className={`${KNOB} top-1/2`} style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
          </div>
          {allowAlpha && (
            <div
              {...fade}
              role="slider"
              aria-label="투명도"
              aria-valuenow={Math.round(a * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-3 touch-none rounded-full"
              style={{ background: swatchBackground(`linear-gradient(to right, transparent, ${rgb})`, 6) }}
            >
              <span className={`${KNOB} top-1/2`} style={{ left: `${a * 100}%`, background: swatchBackground(value, 6) }} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="size-8 shrink-0 rounded-md border border-hairline" style={{ background: swatchBackground(value) }} />
        <input
          aria-label="색 값"
          className={`${FIELD} w-full`}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            // #을 붙여서 적거나 붙여넣어도 숫자만 남긴다. 여섯 자리가 차면 바로 반영한다.
            const next = cleanDigits(e.target.value)
            setDraft(next)
            if (next.length === 6) onChange(withAlpha(`#${next}`, a))
          }}
          onBlur={() => setDraft(rgb.slice(1))}
        />
        {allowAlpha && (
          <label className={`${FIELD} flex w-[72px] shrink-0 items-center gap-1 focus-within:border-selection`}>
            <input
              aria-label="투명도 (%)"
              inputMode="numeric"
              className="w-full min-w-0 bg-transparent text-right outline-none"
              value={percent}
              maxLength={3}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '')
                setPercent(next)
                if (next !== '') onChange(withAlpha(rgb, Math.min(100, Number(next)) / 100))
              }}
              onBlur={() => setPercent(String(Math.round(a * 100)))}
            />
            <span className="font-sans text-xs text-ink-faint">%</span>
          </label>
        )}
      </div>

      {/* 고르는 중인 색이 버튼, 글자, 테두리, 옅은 배경으로 쓰이면 어떤지. 색을 끄는 동안 함께 바뀐다. */}
      {preview && (
        <div className="mt-3 border-t border-hairline pt-3">
          <ColorUses color={value} compact />
        </div>
      )}

      {swatches.length > 0 && (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="mb-2 text-xs font-[550] text-ink-faint">이 디자인 시스템의 색</p>
          {/* 색상 판처럼 목록마다 한 줄. 한 줄에 11칸이라 50부터 950까지가 한 줄에 들어가고, 줄끼리 같은 단계가 위아래로 맞는다. */}
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {swatches.map((row) => (
              <div key={row.group} data-swatch-row={row.group} className="grid grid-cols-11 gap-1">
                {row.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    title={`${color.name} · ${color.hex}`}
                    aria-label={color.name}
                    aria-pressed={color.hex === value}
                    onClick={() => onChange(color.hex)}
                    className={`aspect-square rounded-sm border outline-selection focus-visible:outline-2 ${
                      color.hex === value ? 'border-selection' : 'border-hairline hover:border-ink-faint'
                    }`}
                    style={{ background: swatchBackground(color.hex, 6) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

/**
 * 색 견본. 누르면 옆에 색 선택 창이 열린다.
 * value가 #rrggbb(또는 #rrggbbaa)가 아니면(비어 있거나 rgb() 등) fallback 색에서 고르기 시작한다.
 */
export function ColorSwatch({
  label,
  value,
  fallback = '#888888',
  alpha = false,
  preview = false,
  onChange,
}: {
  label: string
  value: string | null
  fallback?: string
  /** 투명도 막대를 보여 줄지. 켜면 반투명 색을 #rrggbbaa로 낸다. */
  alpha?: boolean
  /** 색 선택 창 안에 그 색이 쓰인 모습을 함께 보여 줄지. 디자인 시스템의 색을 고를 때 켠다(판의 채우기·테두리 색에는 켜지 않는다). */
  preview?: boolean
  onChange: (hex: string) => void
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const hex = value && HEX.test(value.trim()) ? value.trim().toLowerCase() : null
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget.getBoundingClientRect())}
        className={`size-8 shrink-0 rounded-md border outline-selection focus-visible:outline-2 ${anchor ? 'border-selection' : 'border-hairline'}`}
        style={{ background: value ? swatchBackground(value) : undefined }}
      />
      {anchor && (
        <Panel
          anchor={anchor}
          opener={button.current}
          value={hex ? (alpha ? hex : hex.slice(0, 7)) : fallback}
          alpha={alpha}
          preview={preview}
          onChange={onChange}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  )
}
