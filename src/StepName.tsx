import { SLUG } from './lib/catalog'

/**
 * 한 벌 만들기 창의 견본 줄에서 그 단계의 이름을 고치는 칸.
 * 이름은 미리 채워져 있어서 그대로 두어도 되고, 다른 이름 체계(body, title 등)를 쓰고 싶을 때만 고친다.
 * 옆의 값 칸처럼 테두리가 늘 보여서 고칠 수 있는 자리임을 알 수 있다.
 */
export function StepName({ label, value, wide = false, onChange }: { label: string; value: string; /** 'xl'은 body-strong처럼 긴 이름이 잘리지 않는 폭. */ wide?: boolean | 'xl'; onChange: (name: string) => void }) {
  return (
    <input
      aria-label={label}
      spellCheck={false}
      className={`h-6 shrink-0 rounded-sm border border-hairline bg-canvas px-1 font-mono text-xs text-ink-soft outline-none focus:border-selection ${wide === 'xl' ? 'w-28' : wide ? 'w-20' : 'w-14'}`}
      value={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => onChange(e.target.value.trim())}
    />
  )
}

/** 한 벌의 이름들에 문제가 있으면 그 까닭을, 없으면 null을 돌려준다. */
export function nameProblem(names: string[]) {
  if (names.some((n) => !n)) return '이름을 비울 수 없어요.'
  if (names.some((n) => !SLUG.test(n))) return '이름은 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
  if (new Set(names).size !== names.length) return '같은 이름이 두 번 있어요.'
  return null
}
