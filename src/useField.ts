import { useState } from 'react'
import { NAME_SHAPE, SLUG, typedNameProblem } from './lib/catalog'

/**
 * 입력칸의 약속을 한 곳에 둔다(DESIGN.md field-rules). 패널의 칸은 저마다 따로 짜지 않고 이것을 쓴다.
 *
 * - 적는 동안은 저장하지 않는다. 적는 중에 알 수 있는 오류(typed)만 바로 알린다. 적는 도중의 꼴(partial: "-", "0.")과 빈 칸은 알리지 않는다.
 * - 칸을 벗어날 때(Enter도 칸을 벗어난다) 넷 중 하나가 된다.
 *   고치지 않았으면 아무것도 하지 않는다. 들어갔다 나오기만 한 칸은 저장하지 않는다.
 *   비었거나, 적는 중에 알 수 있는 오류가 있거나, 적다 만 꼴이면 저장된 값으로 되돌린다.
 *   다 적어야 아는 오류(done: 같은 이름, 이름의 모양)는 까닭과 함께 칸에 남긴다.
 *   그 밖에는 저장한다.
 * - Esc는 패널이 칸의 글자를 들어올 때의 값으로 돌려놓고 칸을 벗어나게 한다(App.tsx). 그러면 "고치지 않았다"가 되어 저장되지 않는다.
 * - ↑↓나 색 고르기처럼 한 번에 값이 되는 것은 put으로 바로 저장한다.
 */
export type FieldRules = {
  /** 저장되어 있는 값을 칸에 보이는 글자로 적은 것. */
  saved: string
  /** 적는 중에 알 수 있는 오류. 까닭을 돌려준다. */
  typed?: (text: string) => string | null
  /** 적는 도중의 꼴인지. 적는 중에는 알리지 않고, 그대로 벗어나면 되돌린다. */
  partial?: (text: string) => boolean
  /** 다 적어야 아는 오류. 고친 값에만 묻는다. */
  done?: (text: string) => string | null
  /** 비우고 벗어나면 대신 넣을 값(추천값. 빈 글자면 값을 지운다). 주지 않으면 저장된 값으로 되돌린다. */
  blank?: string
  /** 저장할 꼴로 다듬는다(016 → 16). */
  tidy?: (text: string) => string
  /** 저장된 값과 같은지. 주지 않으면 글자가 같은지로 본다. */
  same?: (text: string) => boolean
  /** 저장한다. 받을 수 없으면 까닭을 돌려준다(칸에 남긴다). */
  save: (text: string) => string | null | void
}

type Outcome = { kind: 'same' } | { kind: 'revert' } | { kind: 'keep'; error: string } | { kind: 'save'; text: string }

const sameAs = (rules: FieldRules) => rules.same ?? ((text: string) => text === rules.saved)

/** 칸에 적힌 글자를 어떻게 할지 정한다. */
export function settle(rules: FieldRules, draft: string): Outcome {
  const same = sameAs(rules)
  let text = draft.trim()
  if (same(text)) return { kind: 'same' }
  if (text === '') {
    if (rules.blank === undefined) return { kind: 'revert' }
    text = rules.blank
    if (same(text)) return { kind: 'same' }
  } else {
    if (rules.partial?.(text) || rules.typed?.(text)) return { kind: 'revert' }
    if (rules.tidy) text = rules.tidy(text)
    if (same(text)) return { kind: 'same' }
  }
  const error = rules.done?.(text)
  return error ? { kind: 'keep', error } : { kind: 'save', text }
}

export type FieldState = ReturnType<typeof useField>

export function useField(rules: FieldRules) {
  const [draft, setDraft] = useState(rules.saved)
  const [error, setError] = useState<string | null>(null)
  // 저장된 값이 밖에서 바뀌면(되돌리기, 묶인 값이 따라 바뀜) 칸을 그 값으로 맞춘다. 칸에 적힌 것이 이미 같은 값이면 글자는 그대로 둔다.
  const [seen, setSeen] = useState(rules.saved)
  if (rules.saved !== seen) {
    setSeen(rules.saved)
    if (!sameAs(rules)(draft.trim())) setDraft(rules.saved)
    setError(null)
  }

  /** 자판으로 적는 중. 저장하지 않는다. */
  function type(text: string) {
    setDraft(text)
    const trimmed = text.trim()
    setError(!trimmed || rules.partial?.(trimmed) ? null : (rules.typed?.(text) ?? null))
  }

  function apply(outcome: Outcome) {
    if (outcome.kind === 'same' || outcome.kind === 'revert') {
      setDraft(rules.saved)
      return setError(null)
    }
    if (outcome.kind === 'keep') return setError(outcome.error)
    setDraft(outcome.text)
    const refused = rules.save(outcome.text)
    setError(typeof refused === 'string' ? refused : null)
  }

  /** 칸을 벗어날 때. */
  function leave() {
    apply(settle(rules, draft))
  }

  /** 한 번에 값이 되는 것(↑↓, Tab으로 채움, 색 고르기). 값이 되면 바로 저장한다. */
  function put(text: string) {
    const outcome = settle(rules, text)
    if (outcome.kind === 'revert') return type(text)
    setDraft(text)
    if (outcome.kind === 'same') return setError(null)
    apply(outcome)
  }

  /** 적던 것을 버리고 저장된 값으로 돌아간다. */
  function reset() {
    setDraft(rules.saved)
    setError(null)
  }

  return { draft, error, type, leave, put, reset }
}

/** UnitInput에 그대로 넘기는 속성. */
export function unitProps(field: FieldState) {
  return {
    digits: field.draft,
    invalid: !!field.error,
    onDigits: (digits: string, typing?: boolean) => (typing ? field.type(digits) : field.put(digits)),
    onBlur: field.leave,
  }
}

export const NUMBER = /^-?\d*\.?\d+$/
/** 숫자를 적는 도중의 꼴("-", "1."). 빈 글자나 "0"은 여기에 들지 않는다. */
export const PARTIAL = /^-?\d*\.$|^-$/
/** 0보다 커야 하는 칸에서 0.875를 적는 도중의 꼴(0, 0.0, .0). */
export const ZEROS = /^0*\.?0*$/

/**
 * 이름 칸의 규칙. 쓸 수 없는 글자는 적는 중에 알리고 벗어나면 되돌린다.
 * 글자는 맞지만 모양이 틀린 이름(card-, card--big)과 그 판만의 규칙(같은 이름, 숫자로 시작)은 다 적어야 아는 것이라 칸에 남긴다.
 */
export function nameRules(options: { saved: string; done?: (name: string) => string | null; save: FieldRules['save'] }): FieldRules {
  return {
    saved: options.saved,
    typed: typedNameProblem,
    done: (name) => (!SLUG.test(name) ? NAME_SHAPE : (options.done?.(name) ?? null)),
    save: options.save,
  }
}

/**
 * 숫자 칸의 규칙. 숫자가 아닌 것과 범위 밖의 값은 적는 중에 알리고 벗어나면 되돌린다.
 * 저장할 때는 숫자를 다듬는다(016 → 16, .5 → 0.5).
 */
export function numberRules(options: {
  saved: string
  /** 음수도 받는지(글자 사이, 겹치는 순서). */
  negative?: boolean
  /** 0보다 커야 하는지(글자 크기, 줄 높이, 길이). */
  positive?: boolean
  /** 정수만 받는지. */
  integer?: boolean
  message?: string
  blank?: string
  done?: (digits: string) => string | null
  save: FieldRules['save']
}): FieldRules {
  const { saved, negative = false, positive = false, integer = false, message = '숫자를 입력해 주세요.' } = options
  const shape = integer ? (negative ? /^-?\d+$/ : /^\d+$/) : negative ? NUMBER : /^\d*\.?\d+$/
  return {
    saved,
    blank: options.blank,
    typed: (text) => {
      const digits = text.trim()
      return !shape.test(digits) || (positive && Number(digits) <= 0) ? message : null
    },
    partial: (text) => (negative && text === '-') || (!integer && /^\d*\.$/.test(negative ? text.replace(/^-/, '') : text)) || (positive && ZEROS.test(text)),
    tidy: (text) => String(Number(text)),
    same: (text) => text === saved || (shape.test(text) && NUMBER.test(saved) && Number(text) === Number(saved)),
    done: options.done,
    save: options.save,
  }
}

/** 글자로 적는 값의 규칙. 파일을 깨뜨리는 기호는 적는 중에 알리고 벗어나면 되돌린다. */
export function textRules(options: { saved: string; save: FieldRules['save'] }): FieldRules {
  return { saved: options.saved, typed: (text) => (/[;{}]/.test(text) ? '; { } 기호는 쓸 수 없어요.' : null), save: options.save }
}
