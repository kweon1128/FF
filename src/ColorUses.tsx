// 색이 쓰인 모습. 색을 고민하는 순간에, 이 색이 실제 화면에서 어떻게 보일지를 작은 견본으로 바로 보여 준다.
// 밝은 바탕 위의 버튼·글자·테두리·옅은 배경, 그리고 어두운 바탕 위의 버튼과 글자.
// 이 안은 사용자의 색을 보여 주는 미리보기 틀이라, FF 도구의 흑백 규칙을 따르지 않는다.

import { createContext, useContext, useState, type CSSProperties } from 'react'
import { contrast } from './lib/color'
import { SCALE_STEPS, makeScale, nearestStep } from './lib/scale'

/** 견본에 쓰는 바탕과 글자. 밝은 쪽은 흰 바탕에 거의 검은 글자, 어두운 쪽은 그 반대. */
export const LIGHT = { surface: '#ffffff', ink: '#1a1a1a' }
export const DARK = { surface: '#18181b', ink: '#f4f4f5' }
/** 비활성 버튼은 이 색을 이만큼만 진하게 보여 준다. */
const DISABLED_OPACITY = 0.4

/**
 * 견본의 글자에 쓸 글꼴(디자인 시스템의 글꼴 값). 없으면 FF의 글꼴 그대로다.
 * 패널과 색 선택 창 어디에 놓이든 같은 글꼴을 쓰도록 App이 넣어 준다.
 */
export const PreviewFontContext = createContext<string | undefined>(undefined)

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
const BUTTON = 'flex h-7 shrink-0 items-center rounded-md px-2.5 text-sm leading-none font-[550] whitespace-nowrap select-none'
const BOX = 'flex h-7 min-w-0 items-center justify-center rounded-md px-2 text-sm leading-none whitespace-nowrap'

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
  const { hover, pressed } = statesOf(color, step)
  const pad = compact ? 'p-2' : 'p-3'
  const gap = compact ? 'space-y-1.5' : 'space-y-2'
  // 옅은 배경: 이 색을 바탕에 조금만 섞는다. 밝은 쪽은 흰색에 12%, 어두운 쪽은 짙은 바탕에 24%.
  const soft = (surface: string, amount: number): CSSProperties => ({
    background: `color-mix(in oklab, ${color} ${amount}%, ${surface})`,
    color,
  })

  // 밝은 바탕과 어두운 바탕에 똑같은 구성을 놓는다. 같은 자리끼리 견주어 볼 수 있다.
  // 다른 것은 바탕과 글자색, 그리고 옅은 배경에 색을 섞는 양뿐이다(어두운 바탕에서는 더 많이 섞어야 보인다).
  const surfaces = [
    { ...LIGHT, mix: 12, edge: 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]' },
    { ...DARK, mix: 24, edge: '' },
  ]

  return (
    <div className={gap} style={{ fontFamily: font }}>
      {surfaces.map((s) => (
        <div key={s.surface} className={`${gap} ${pad} rounded-md ${s.edge}`} style={{ background: s.surface }}>
          <div className="flex flex-wrap gap-1.5">
            <LiveButton color={color} hover={hover} pressed={pressed} />
            {/* 비활성: 같은 색을 흐리게. 쓸 수 없는 상태에서도 색이 남는지, 너무 사라지는지 본다. */}
            <span className={BUTTON} style={{ background: color, color: inkOn(color), opacity: DISABLED_OPACITY }}>
              <span className={TRIM}>비활성</span>
            </span>
          </div>
          {/* 같은 색이어도 글자가 작아지면 덜 읽힌다. 큰 글자와 작은 글자를 함께 본다. */}
          <div style={{ color }}>
            <p className="truncate text-base font-[650]">큰 글자 가나다 Aa</p>
            <p className="truncate text-xs">작은 글자 가나다라마바사 Aa 123</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <span className={BOX} style={{ border: `1px solid ${color}`, color: s.ink }}>
              <span className={TRIM}>테두리</span>
            </span>
            <span className={`${BOX} font-[550]`} style={soft(s.surface, s.mix)}>
              <span className={TRIM}>옅은 배경</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
