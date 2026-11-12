// tokens.css 안의 @theme 블록을 읽고 쓴다.
// @theme 바깥의 내용은 건드리지 않는다. 블록 안의 주석은 붙어 있던 값을 따라 보존한다.

export type Token = { name: string; value: string }

const THEME_START = /@theme\b[^{;]*\{/

function findTheme(css: string) {
  const match = THEME_START.exec(css)
  if (!match) return null
  const open = match.index + match[0].length
  let depth = 1
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return { open, close: i }
  }
  return null
}

export function parseTokens(css: string): Token[] {
  const theme = findTheme(css)
  if (!theme) return []
  const body = css.slice(theme.open, theme.close).replace(/\/\*[\s\S]*?\*\//g, '')
  const tokens: Token[] = []
  const declaration = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+);/g
  for (const m of body.matchAll(declaration)) {
    tokens.push({ name: m[1], value: m[2].trim().replace(/\s+/g, ' ') })
  }
  return tokens
}

/**
 * @theme 안의 주석을 값마다 모은다. 값 위에 있던 주석(before)과 같은 줄 뒤에 붙은 주석(after),
 * 그리고 맨 끝에 남은 주석(tail). 저장할 때 값의 순서가 바뀌어도 주석이 제 값을 따라가게 하려는 것이다.
 */
function readNotes(body: string) {
  const notes = new Map<string, { before: string[]; after: string[] }>()
  let pending: string[] = []
  let last: { name: string; end: number } | null = null
  for (const m of body.matchAll(/\/\*[\s\S]*?\*\/|(--[A-Za-z0-9_-]+)\s*:\s*[^;{}]+;/g)) {
    if (m[1]) {
      notes.set(m[1], { before: pending, after: [] })
      pending = []
      last = { name: m[1], end: m.index + m[0].length }
    } else if (last && !body.slice(last.end, m.index).includes('\n')) {
      // 값과 같은 줄에 이어 적은 주석은 그 값의 것이다.
      notes.get(last.name)!.after.push(m[0])
    } else {
      pending.push(m[0])
    }
  }
  return { notes, tail: pending }
}

export function writeTokens(css: string, tokens: Token[]): string {
  const theme = findTheme(css)
  const { notes, tail } = theme ? readNotes(css.slice(theme.open, theme.close)) : { notes: new Map(), tail: [] as string[] }
  const body =
    tokens
      .map((t) => {
        const note = notes.get(t.name)
        const before = (note?.before ?? []).map((c: string) => `  ${c}\n`).join('')
        const after = (note?.after ?? []).map((c: string) => ` ${c}`).join('')
        return `${before}  ${t.name}: ${t.value};${after}\n`
      })
      .join('') + tail.map((c) => `  ${c}\n`).join('')
  if (!theme) {
    const head = css.trimEnd()
    return `${head}${head ? '\n\n' : ''}@theme {\n${body}}\n`
  }
  return `${css.slice(0, theme.open)}\n${body}${css.slice(theme.close)}`
}

export function isValidToken(token: unknown): token is Token {
  if (!token || typeof token !== 'object') return false
  const { name, value } = token as Record<string, unknown>
  return (
    typeof name === 'string' &&
    typeof value === 'string' &&
    /^--[A-Za-z0-9_-]+$/.test(name) &&
    value.trim().length > 0 &&
    !/[;{}\n\r]/.test(value)
  )
}
