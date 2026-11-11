// tokens.css 안의 @theme 블록을 읽고 쓴다.
// @theme 바깥의 내용은 건드리지 않는다. 블록 안의 주석은 저장할 때 사라진다.

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

export function writeTokens(css: string, tokens: Token[]): string {
  const body = tokens.map((t) => `  ${t.name}: ${t.value};\n`).join('')
  const theme = findTheme(css)
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
