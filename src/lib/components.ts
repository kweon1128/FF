// 컴포넌트의 구조. systems/이름/components.json 에 저장한다.
// 모든 속성은 기본 값(tokens.css)의 변수 이름을 가리킨다. 직접 적은 값은 쓰지 않는다.

import type { CSSProperties } from 'react'
import type { Token } from './api'

export const STATES = [
  { id: 'default', label: '기본' },
  { id: 'hover', label: '마우스 올림' },
  { id: 'pressed', label: '누름' },
  { id: 'disabled', label: '비활성' },
] as const

export type StateId = (typeof STATES)[number]['id']

/** 기본 값의 변수 이름. 비어 있으면 정하지 않은 것. */
type Ref = string | undefined

export type Colors = { bg?: string; text?: string; border?: string }

/** 종류: 색을 맡는다. 기본이 아닌 상태에서 비운 색은 기본 상태의 색을 따른다. */
export type Variant = { name: string; states: Record<StateId, Colors> }

/** 크기: 여백과 글자 크기를 맡는다. */
export type Size = { name: string; padX?: string; padY?: string; textSize?: string; gap?: string }

export type IconPos = 'none' | 'before' | 'after'

export type Comp = {
  name: string
  /** 미리보기에 쓰는 글자 */
  label: string
  font?: string
  weight?: string
  radius?: string
  borderWidth?: string
  icon?: string
  iconPos: IconPos
  variants: Variant[]
  sizes: Size[]
}

export type Cell = { v: number; s: number; state: StateId }

const emptyStates = (): Record<StateId, Colors> => ({ default: {}, hover: {}, pressed: {}, disabled: {} })

export const newVariant = (name: string): Variant => ({ name, states: emptyStates() })
export const newSize = (name: string): Size => ({ name })

/** 빈 상자에서 시작하는 새 컴포넌트. */
export function newComp(name: string): Comp {
  return { name, label: name, iconPos: 'none', variants: [newVariant('default')], sizes: [newSize('md')] }
}

/** 이미 쓰는 이름과 겹치지 않는 새 이름. */
export function freshName(taken: string[], base = 'new') {
  let name = base
  for (let i = 2; taken.includes(name); i++) name = `${base}${i}`
  return name
}

const ref = (v: unknown): Ref => (typeof v === 'string' && v.startsWith('--') ? v : undefined)
const text = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback)

function colors(raw: any): Colors {
  return { bg: ref(raw?.bg), text: ref(raw?.text), border: ref(raw?.border) }
}

/** 파일에서 읽은 내용을 빠진 곳 없이 채운다. 손으로 고친 파일도 화면이 깨지지 않게 한다. */
export function normalize(raw: unknown): Comp[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c && typeof c === 'object' && typeof c.name === 'string' && c.name)
    .map((c: any): Comp => {
      const variants: Variant[] = (Array.isArray(c.variants) ? c.variants : []).map((v: any, i: number) => ({
        name: text(v?.name, `variant${i + 1}`),
        states: {
          default: colors(v?.states?.default),
          hover: colors(v?.states?.hover),
          pressed: colors(v?.states?.pressed),
          disabled: colors(v?.states?.disabled),
        },
      }))
      const sizes: Size[] = (Array.isArray(c.sizes) ? c.sizes : []).map((s: any, i: number) => ({
        name: text(s?.name, `size${i + 1}`),
        padX: ref(s?.padX),
        padY: ref(s?.padY),
        textSize: ref(s?.textSize),
        gap: ref(s?.gap),
      }))
      return {
        name: c.name,
        label: typeof c.label === 'string' ? c.label : c.name,
        font: ref(c.font),
        weight: ref(c.weight),
        radius: ref(c.radius),
        borderWidth: ref(c.borderWidth),
        icon: typeof c.icon === 'string' && c.icon ? c.icon : undefined,
        iconPos: c.iconPos === 'before' || c.iconPos === 'after' ? c.iconPos : 'none',
        variants: variants.length ? variants : [newVariant('default')],
        sizes: sizes.length ? sizes : [newSize('md')],
      }
    })
}

/** 기본 값의 이름이 바뀌면 그 값을 가리키던 곳도 함께 바꾼다. */
export function renameRef(comps: Comp[], from: string, to: string): Comp[] {
  const r = (v: Ref) => (v === from ? to : v)
  return comps.map((c) => ({
    ...c,
    font: r(c.font),
    weight: r(c.weight),
    radius: r(c.radius),
    borderWidth: r(c.borderWidth),
    variants: c.variants.map((v) => ({
      ...v,
      states: Object.fromEntries(
        STATES.map(({ id }) => {
          const s = v.states[id]
          return [id, { bg: r(s.bg), text: r(s.text), border: r(s.border) }]
        }),
      ) as Record<StateId, Colors>,
    })),
    sizes: c.sizes.map((s) => ({ ...s, padX: r(s.padX), padY: r(s.padY), textSize: r(s.textSize), gap: r(s.gap) })),
  }))
}

/** 한 칸(종류 · 크기 · 상태)의 실제 모양. 가리키는 값이 없어졌으면 정하지 않은 것으로 본다. */
export function cellStyle(comp: Comp, cell: Cell, tokens: Token[]): CSSProperties {
  const value = (name: Ref) => (name ? tokens.find((t) => t.name === name)?.value : undefined)
  const variant = comp.variants[cell.v] ?? comp.variants[0]
  const size = comp.sizes[cell.s] ?? comp.sizes[0]
  const base = variant.states.default
  const now = variant.states[cell.state]
  const color = (key: keyof Colors) => value(now[key]) ?? value(base[key])

  const width = value(comp.borderWidth)
  const border = color('border')
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: value(size.gap),
    padding: `${value(size.padY) ?? '0'} ${value(size.padX) ?? '0'}`,
    background: color('bg'),
    color: color('text'),
    // 굵기만 정하고 색을 비운 종류는 투명한 테두리를 둬서, 테두리가 있는 종류와 크기가 같게 한다.
    border: width ? `${width} solid ${border ?? 'transparent'}` : undefined,
    borderRadius: value(comp.radius),
    fontFamily: value(comp.font),
    fontWeight: value(comp.weight),
    fontSize: value(size.textSize),
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  }
}

export function cellLabel(comp: Comp, cell: Cell) {
  const state = STATES.find((s) => s.id === cell.state)!.label
  return `${comp.variants[cell.v]?.name} · ${comp.sizes[cell.s]?.name} · ${state}`
}
