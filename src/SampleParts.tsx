// 예시 그림들이 함께 쓰는 조각. FF 화면의 실제 요소(왼쪽 메뉴의 줄, 패널의 구역)를 보여 주는 시스템의 색으로 그린다.
// 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.

import { CaseSensitive, LayoutGrid, Palette, Ruler, Square, Tags, Type, type LucideIcon } from 'lucide-react'
import { ICON_STROKE } from './lib/icons'
import type { SampleColors } from './lib/sample'

/** 메뉴 줄의 아이콘. 줄의 말이 FF의 화면 이름이면 그 화면의 아이콘이고, 아니면 네모다. */
const NAV_ICONS: Record<string, LucideIcon> = { '전체 보기': LayoutGrid, 색상: Palette, '의미 색': Tags, 글꼴: Type, '의미 글꼴': CaseSensitive, 간격: Ruler }

/** 그 말이 FF의 화면 이름인지(왼쪽 메뉴의 줄인지). */
export const isNavLabel = (text: string) => text in NAV_ICONS

/** 메뉴 줄 앞의 아이콘(16px). */
export function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICONS[label] ?? Square
  return <Icon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />
}

/**
 * 왼쪽 메뉴의 줄들. 첫 줄은 지금 열려 있는 화면이다(옅은 바탕, 굵은 글자). 나머지는 옅은 글자다.
 * radius를 주면 줄의 둥글기를 그 값으로 그리고 줄마다 data-sample을 붙인다(의미 모서리 판의 예시).
 */
export function NavRows({ labels, colors, radius }: { labels: string[]; colors: SampleColors; radius?: string }) {
  return (
    <span className="block space-y-rows">
      {labels.map((text, i) => {
        const Icon = NAV_ICONS[text] ?? Square
        return (
          <span
            key={i}
            {...(radius === undefined ? {} : { 'data-sample': true })}
            className={`flex h-row items-center gap-row-inner px-row-x text-base leading-6 whitespace-nowrap ${radius === undefined ? 'rounded-row' : ''} ${i === 0 ? 'font-[550]' : ''}`}
            style={{ ...(radius === undefined ? {} : { borderRadius: radius }), ...(i === 0 ? { background: colors.hover } : { color: colors.soft }) }}
          >
            <Icon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />
            {text}
          </span>
        )
      })}
    </span>
  )
}

/** 패널의 구역 하나. 구역의 제목과 그 아래의 입력칸이다. "제목=값"으로 적고, 값은 입력칸에 적혀 있는 글자다(칸보다 길면 실제 입력칸처럼 칸에서 잘린다). */
export function PanelSection({ item, colors }: { item: string; colors: SampleColors }) {
  const at = item.indexOf('=')
  const title = (at === -1 ? item : item.slice(0, at)).trim()
  const value = at === -1 ? '' : item.slice(at + 1).trim()
  return (
    <span className="block px-section-x py-section-y">
      <span className="mb-heading block text-sm leading-5 font-[650]">{title}</span>
      <span className="flex h-control items-center overflow-hidden rounded-control px-input-x text-sm leading-5 whitespace-nowrap" style={{ boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
        {value}
      </span>
    </span>
  )
}
