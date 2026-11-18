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
      className={`h-compact shrink-0 rounded-small border-edge border-hairline bg-canvas px-chip-x type-code-sm text-ink-soft outline-none focus:border-selection ${wide === 'xl' ? 'w-cell-long' : wide ? 'w-cell' : 'w-cell-short'}`}
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

/**
 * 한 벌을 만들면 그 종류의 예전 값이 어떻게 되는지 알리는 글. 만들기 전에 알아야 하는 일이라 버튼 옆에 적는다.
 * 한 벌 만들기는 그 종류를 통째로 새로 정한다. 같은 이름의 값은 새 값으로 바뀌고, 새 한 벌에 없는 이름의 값은 지워진다.
 * 지워지는 값 가운데 다른 곳에서 쓰고 있는 것이 있으면 그것을 빨갛게 따로 알린다. 막지는 않는다(되돌리기로 살릴 수 있다).
 * made는 새 한 벌의 이름들, existing은 지금 있는 이름들, users는 지금 있는 값마다 그것을 쓰는 곳들이다.
 */
export function SetNotice({ made, existing, users }: { made: string[]; existing: string[]; users: Record<string, string[]> }) {
  const kept = made.filter((name) => existing.includes(name)).length
  const removed = existing.filter((name) => !made.includes(name))
  const used = removed.filter((name) => users[name]?.length)
  if (kept === 0 && removed.length === 0) return null
  // 이름이 많으면 앞의 넷만 적는다.
  const few = (names: string[]) => (names.length > 4 ? `${names.slice(0, 4).join(', ')} 외 ${names.length - 4}개` : names.join(', '))
  return (
    <span data-set-notice className="mr-actions-tight type-body text-ink-faint">
      {kept > 0 && `이미 있는 ${kept}개는 새 값으로 바뀌어요.`}
      {removed.length > 0 && ` 한 벌에 없는 ${removed.length}개(${few(removed)})는 지워져요.`}
      {used.length > 0 && (
        <span role="alert" className="text-danger">
          {' '}
          쓰고 있는 값도 지워져요: {used.map((name) => `${name} (${few(users[name])})`).join(', ')}
        </span>
      )}
    </span>
  )
}
