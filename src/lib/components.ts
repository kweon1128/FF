// 컴포넌트의 구조. systems/이름/components.json 에 저장한다.
// 모든 속성은 기본 값(tokens.css)의 변수 이름을 가리킨다. 직접 적은 값은 쓰지 않는다.

import type { CSSProperties } from 'react'
import type { Token } from './api'
import { lineName } from './catalog'
import { refOf, resolveColor } from './roles'

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
  // 의미 색은 다른 색을 가리키는 값이라, 가리키는 색을 따라가 실제 색을 쓴다(FF 화면에는 사용자의 변수가 선언되어 있지 않다).
  const value = (name: Ref) => {
    const raw = name ? tokens.find((t) => t.name === name)?.value : undefined
    return raw && refOf(raw) ? (resolveColor(tokens, raw) ?? undefined) : raw
  }
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
    // 줄 높이는 글자 크기에 묶인 px 값을 쓴다. 그래야 글꼴을 바꿔도 버튼의 높이가 같다. 묶인 값이 없을 때만 1.2배다.
    lineHeight: (size.textSize && value(lineName(size.textSize))) || 1.2,
    whiteSpace: 'nowrap',
  }
}

/**
 * 컴포넌트 안의 글자를 감싸는 조각의 모양. 글자를 줄 상자가 아니라 글자 모양(대문자 높이에서 기준선까지)을 기준으로 상자 가운데에 놓는다.
 * 줄 상자를 기준으로 하면 브라우저가 남는 공간을 위아래로 나눌 때 위쪽을 작게 잡아서 글자가 1px 안쪽으로 올라가고, 여백이 작은 뱃지에서는 그것이 눈에 보인다.
 * 높이를 줄 높이(1lh)로 잡아 두어서 컴포넌트의 높이는 "줄 높이 + 위아래 여백" 그대로다. 이 속성은 글자를 직접 담은 조각에만 듣기 때문에(상자 자체에 주면 듣지 않는다) 글자를 따로 감싼다.
 * compCss의 `.이름__label` 규칙과 같은 내용이다.
 */
export const LABEL_CLASS = 'block h-[1lh] content-center [text-box:trim-both_cap_alphabetic]'

const COMMON_LABELS = { font: '글꼴', weight: '굵기', radius: '모서리', borderWidth: '테두리 굵기' } as const
const COLOR_LABELS = { bg: '바탕색', text: '글자색', border: '테두리색' } as const
const SIZE_LABELS = { padX: '좌우 여백', padY: '위아래 여백', textSize: '글자 크기', gap: '아이콘과 글자 사이' } as const

/** 이 기본 값을 쓰는 컴포넌트와 그 자리들. */
export function usesOf(comps: Comp[], token: string): { index: number; name: string; where: string[] }[] {
  return comps
    .map((c, index) => {
      const where: string[] = []
      for (const [key, label] of Object.entries(COMMON_LABELS)) if (c[key as keyof typeof COMMON_LABELS] === token) where.push(label)
      for (const v of c.variants)
        for (const { id, label } of STATES)
          for (const [key, name] of Object.entries(COLOR_LABELS))
            if (v.states[id][key as keyof Colors] === token) where.push(`${v.name} · ${label} · ${name}`)
      for (const s of c.sizes)
        for (const [key, label] of Object.entries(SIZE_LABELS))
          if (s[key as keyof typeof SIZE_LABELS] === token) where.push(`${s.name} · ${label}`)
      return { index, name: c.name, where }
    })
    .filter((u) => u.where.length > 0)
}

/** 종류나 크기를 통째로 하나 더 만든다. */
export const cloneVariant = (v: Variant, name: string): Variant => ({
  name,
  states: Object.fromEntries(STATES.map(({ id }) => [id, { ...v.states[id] }])) as Record<StateId, Colors>,
})

/** 컴포넌트를 CSS로 옮긴다. 값은 모두 기본 값의 변수를 가리킨다. */
export function compCss(comp: Comp): string {
  const v = (name: Ref) => (name ? `var(${name})` : undefined)
  const rule = (selector: string, lines: [string, string | undefined][]) => {
    const body = lines.filter(([, value]) => value).map(([prop, value]) => `  ${prop}: ${value};`)
    return body.length ? `${selector} {\n${body.join('\n')}\n}` : ''
  }
  const base = `.${comp.name}`
  const colors = (c: Colors): [string, string | undefined][] => [
    ['background', v(c.bg)],
    ['color', v(c.text)],
    ['border-color', v(c.border)],
  ]
  const suffix: Record<StateId, string> = { default: '', hover: ':hover', pressed: ':active', disabled: ':disabled' }
  return [
    rule(base, [
      ['display', 'inline-flex'],
      ['align-items', 'center'],
      ['justify-content', 'center'],
      ['border', comp.borderWidth ? `var(${comp.borderWidth}) solid transparent` : undefined],
      ['border-radius', v(comp.radius)],
      ['font-family', v(comp.font)],
      ['font-weight', v(comp.weight)],
      ['line-height', '1.2'],
      ['white-space', 'nowrap'],
    ]),
    // 글자를 <span class="이름__label">로 감싸면 글자 모양을 기준으로 상자 가운데에 놓인다(LABEL_CLASS와 같은 내용). 감싸지 않은 글자는 줄 상자를 기준으로 놓인다.
    `/* 글자를 <span class="${comp.name}__label">로 감싸면 위아래 가운데가 글자 모양에 맞춰진다. */\n` +
      rule(`${base}__label`, [
        ['display', 'block'],
        ['height', '1lh'],
        ['align-content', 'center'],
        ['text-box', 'trim-both cap alphabetic'],
      ]),
    ...comp.sizes.map((s) =>
      rule(`${base}--${s.name}`, [
        ['padding', s.padX || s.padY ? `${v(s.padY) ?? '0'} ${v(s.padX) ?? '0'}` : undefined],
        ['font-size', v(s.textSize)],
        // 글자 크기에 묶인 줄 높이. 묶인 값이 없는 크기면 기본 규칙의 1.2배가 그대로 쓰인다.
        ['line-height', s.textSize ? `var(${lineName(s.textSize)}, 1.2)` : undefined],
        ['gap', v(s.gap)],
      ]),
    ),
    ...comp.variants.flatMap((variant) =>
      STATES.map(({ id }) => rule(`${base}--${variant.name}${suffix[id]}`, colors(variant.states[id]))),
    ),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function cellLabel(comp: Comp, cell: Cell) {
  const state = STATES.find((s) => s.id === cell.state)!.label
  return `${comp.variants[cell.v]?.name} · ${comp.sizes[cell.s]?.name} · ${state}`
}
