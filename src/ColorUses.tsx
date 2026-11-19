// 색이 쓰인 모습. 색을 고민하는 순간에, 이 색이 실제 화면에서 어떻게 보일지를 작은 견본으로 바로 보여 준다.
// 버튼·글자·테두리·옅은 배경을 카드 하나에 놓는다. 바탕은 밝은 것이 기본이고, 카드 오른쪽 위의 버튼으로 어두운 바탕으로 바꿔 본다.
// 이 안은 사용자의 색을 보여 주는 미리보기 틀이라, FF 도구의 흑백 규칙을 따르지 않는다.

import { ICON_STROKE } from './lib/icons'
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { contrast } from './lib/color'
import { SCALE_STEPS, makeScale, nearestStep } from './lib/scale'

/** 견본에 쓰는 바탕과 글자. 밝은 쪽은 흰 바탕에 거의 검은 글자, 어두운 쪽은 그 반대. */
export const LIGHT = { surface: '#ffffff', ink: '#1a1a1a' }
export const DARK = { surface: '#18181b', ink: '#f4f4f5' }
/** 견본의 바탕을 어둡게 해 두었는지를 브라우저에 기억하는 이름. 패널과 색 선택 창이 함께 쓴다. */
const DARK_KEY = 'ff.usesDark'
/** 비활성 버튼은 이 색을 이만큼만 진하게 보여 준다. */
const DISABLED_OPACITY = 0.4

/**
 * 견본의 글자에 쓸 글꼴(디자인 시스템의 글꼴 값). 없으면 FF의 글꼴 그대로다.
 * 패널과 색 선택 창 어디에 놓이든 같은 글꼴을 쓰도록 App이 넣어 준다.
 */
export const PreviewFontContext = createContext<string | undefined>(undefined)

/**
 * 그림(예시, 견본, 화면 예시)에 깔아 줄, 보여 주는 디자인 시스템의 간격 변수들(--spacing-이름: 길이).
 * 그림 안의 여백과 틈은 FF 화면과 같은 의미 간격 클래스(px-button-x, gap-actions)로 적는다. 그 클래스는 var(--spacing-이름)을 읽으므로,
 * 그림의 뿌리에 이 변수들을 깔면 그 안에서는 그 시스템의 값으로 그려진다. 그 시스템에 없는 이름은 FF의 값이 그대로 쓰인다.
 * 색과 글꼴은 그 시스템의 것을 읽으면서 간격만 FF의 숫자로 그리면, 그 시스템이 버튼 여백을 바꿔도 그림은 따라가지 않는다.
 */
export const PreviewSpaceContext = createContext<CSSProperties>({})

/** 그림을 감싸 그 안에 보여 주는 시스템의 간격 변수를 깔아 주는 상자. 뿌리 요소에 직접 깔 수 없는 그림에 쓴다. */
export function PreviewSpace({ children }: { children: ReactNode }) {
  const space = useContext(PreviewSpaceContext)
  return <div style={space}>{children}</div>
}

/**
 * 이 색이 버튼일 때 마우스를 올리고 눌렀을 때의 색. 이 색에서 한 단계, 두 단계 짙은 색을 "단계 생성"과 같은 계산으로 만든다.
 * 목록에 지금 들어 있는 다음 단계를 가져오지 않고 이 색에서 바로 계산하므로, 색을 바꾸는 동안 함께 따라 바뀐다.
 * step은 이 색의 단계(50~950). 모르면 색의 밝기에 가장 가까운 단계로 본다. 가장 짙은 단계에서는 더 짙은 색이 없어 이 색 그대로다.
 */
export function statesOf(hex: string, step?: number) {
  const rgb = hex.slice(0, 7)
  const base = step !== undefined && SCALE_STEPS.includes(step) ? step : nearestStep(rgb)
  const scale = makeScale(rgb, base)
  const darker = SCALE_STEPS.filter((s) => s > base)
  const hover = darker[0] === undefined ? hex : scale[darker[0]]
  return { hover, pressed: darker[1] === undefined ? hover : scale[darker[1]] }
}

/** 이 색을 바탕으로 깔았을 때 올릴 글자색. 흰색과 검정 중 더 잘 읽히는 쪽을 고른다. */
export function inkOn(hex: string) {
  const rgb = hex.slice(0, 7)
  return contrast(rgb, '#ffffff') >= contrast(rgb, '#000000') ? '#ffffff' : '#000000'
}

/**
 * 상자 안의 글자에 준다. 글꼴마다 글자 위아래에 잡아 둔 여백이 달라서, 그대로 가운데에 놓으면 글꼴에 따라 위나 아래로 1~2px 치우친다.
 * 줄 상자에서 그 여백을 잘라 내고(대문자 높이에서 기준선까지만 남김) 글자 자체를 가운데에 놓는다.
 */
export const TRIM = 'block [text-box:trim-both_cap_alphabetic]'
const BUTTON = 'flex h-control shrink-0 items-center rounded-control px-button-x text-sm font-[550] whitespace-nowrap select-none'
const BOX = 'flex h-control min-w-0 items-center justify-center rounded-control px-input-x text-sm whitespace-nowrap'

/**
 * 실제로 반응하는 버튼. 마우스를 올리면 한 단계 짙은 색, 누르면 두 단계 짙은 색이 된다.
 * 세 색을 늘어놓지 않고 버튼 하나로 직접 만져 보게 한다. 글자색은 평소 색에 맞춰 한 번 정하고, 올리거나 눌러도 바꾸지 않는다(실제 버튼도 그렇다).
 */
function LiveButton({ color, hover, pressed }: { color: string; hover: string; pressed: string }) {
  const [state, setState] = useState<'rest' | 'hover' | 'pressed'>('rest')
  const now = state === 'pressed' ? pressed : state === 'hover' ? hover : color
  return (
    <span
      title="마우스를 올리거나 눌러 볼 수 있어요"
      className={`${BUTTON} cursor-pointer`}
      style={{ background: now, color: inkOn(color) }}
      onPointerEnter={() => setState('hover')}
      onPointerLeave={() => setState('rest')}
      onPointerDown={() => setState('pressed')}
      onPointerUp={() => setState('hover')}
    >
      <span className={TRIM}>버튼</span>
    </span>
  )
}

/**
 * color는 #rrggbb(투명하면 #rrggbbaa). step은 이 색의 단계로, 올림·누름 색을 계산할 때 기준이 된다.
 * compact는 색 선택 창 안에 넣을 때 쓴다. 여백을 줄인다.
 */
export function ColorUses({ color, step, compact = false }: { color: string; step?: number; compact?: boolean }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const { hover, pressed } = statesOf(color, step)
  const pad = compact ? 'p-box' : 'p-sample'
  const gap = compact ? 'space-y-rows' : 'space-y-blocks'
  // 옅은 배경: 이 색을 바탕에 조금만 섞는다. 밝은 쪽은 흰색에 12%, 어두운 쪽은 짙은 바탕에 24%.
  const soft = (surface: string, amount: number): CSSProperties => ({
    background: `color-mix(in oklab, ${color} ${amount}%, ${surface})`,
    color,
  })

  // 카드는 하나다. 밝은 바탕과 어두운 바탕을 위아래로 다 늘어놓으면 패널의 절반을 차지해서, 값을 고치러 온 패널에서 견본이 주인공이 된다.
  // 바탕은 카드 오른쪽 위의 버튼으로 바꾸고, 고른 쪽을 기억한다. 두 바탕의 구성은 똑같고, 다른 것은 바탕과 글자색, 옅은 배경에 색을 섞는 양뿐이다(어두운 바탕에서는 더 많이 섞어야 보인다).
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(DARK_KEY) === '1'
    } catch {
      return false
    }
  })
  function toggleDark() {
    setDark(!dark)
    try {
      localStorage.setItem(DARK_KEY, dark ? '0' : '1')
    } catch {
      // 기억하지 못해도 바꿔 보는 데는 문제가 없다.
    }
  }
  const s = dark ? { ...DARK, mix: 24, edge: '' } : { ...LIGHT, mix: 12, edge: 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]' }
  const Icon = dark ? Sun : Moon

  return (
    <div style={{ ...space, fontFamily: font }}>
      {[s].map((s) => (
        <div key={s.surface} data-uses={dark ? 'dark' : 'light'} className={`${gap} ${pad} rounded-card ${s.edge}`} style={{ background: s.surface }}>
          <div className="flex flex-wrap items-center gap-actions">
            <LiveButton color={color} hover={hover} pressed={pressed} />
            {/* 비활성: 같은 색을 흐리게. 쓸 수 없는 상태에서도 색이 남는지, 너무 사라지는지 본다. */}
            <span className={BUTTON} style={{ background: color, color: inkOn(color), opacity: DISABLED_OPACITY }}>
              <span className={TRIM}>비활성</span>
            </span>
            {/* 바탕 바꾸기. 글자색은 지금 바탕의 글자색을 따라서 어느 바탕에서나 보인다. */}
            <button
              type="button"
              aria-pressed={dark}
              aria-label={dark ? '밝은 바탕으로 보기' : '어두운 바탕으로 보기'}
              title={dark ? '밝은 바탕으로 보기' : '어두운 바탕으로 보기'}
              onClick={toggleDark}
              className="ml-auto flex size-[28px] shrink-0 items-center justify-center rounded-control opacity-[0.6] outline-selection hover:opacity-100 focus-visible:outline-focus"
              style={{ color: s.ink }}
            >
              <Icon size={16} strokeWidth={ICON_STROKE} />
            </button>
          </div>
          {/* 같은 색이어도 글자가 작아지면 덜 읽힌다. 큰 글자와 작은 글자를 함께 본다. */}
          <div style={{ color }}>
            <p className="truncate text-base font-[650]">큰 글자 가나다 Aa</p>
            <p className="truncate text-xs">작은 글자 가나다라마바사 Aa 123</p>
          </div>
          <div className="grid grid-cols-2 gap-field-row">
            <span className={BOX} style={{ border: `1px solid ${color}`, color: s.ink }}>
              <span className={TRIM}>테두리</span>
            </span>
            <span className={`${BOX} font-[550]`} style={soft(s.surface, s.mix)}>
              <span className={TRIM}>옅은 바탕</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
