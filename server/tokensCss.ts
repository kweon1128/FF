// tokens.css 안의 @theme 블록을 읽고 쓴다.
// @theme 바깥의 내용은 건드리지 않는다(FF가 만드는 의미 글꼴 클래스 구역만 예외). 블록 안의 주석은 붙어 있던 값을 따라 보존한다.

/** note는 값과 같은 줄 뒤에 붙은 주석의 내용. 의미 색의 역할과 설명을 여기에 적는다. */
export type Token = { name: string; value: string; note?: string }

const inner = (comment: string) => comment.slice(2, -2).trim()

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
  const raw = css.slice(theme.open, theme.close)
  const { notes } = readNotes(raw)
  const body = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  const tokens: Token[] = []
  const declaration = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+);/g
  for (const m of body.matchAll(declaration)) {
    const after = notes.get(m[1])?.after[0]
    tokens.push({ name: m[1], value: m[2].trim().replace(/\s+/g, ' '), ...(after ? { note: inner(after) } : {}) })
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
        // note를 보내지 않은 값은 붙어 있던 주석을 그대로 둔다. 보냈고 내용이 달라졌으면 그것으로 바꾼다(비우면 지운다).
        const kept: string[] = note?.after ?? []
        const same = t.note === undefined || (kept[0] !== undefined && inner(kept[0]) === t.note)
        const after = same ? kept.map((c) => ` ${c}`).join('') : t.note ? ` /* ${t.note} */` : ''
        return `${before}  ${t.name}: ${t.value};${after}\n`
      })
      .join('') + tail.map((c) => `  ${c}\n`).join('')
  if (!theme) {
    const head = css.trimEnd()
    return withGuide(withTypeClasses(`${head}${head ? '\n\n' : ''}@theme {\n${body}}\n`, tokens))
  }
  return withGuide(withTypeClasses(`${css.slice(0, theme.open)}\n${body}${css.slice(theme.close)}`, tokens))
}

// 파일 맨 위에 적어 두는 안내. 이 파일을 여는 AI에게, 값 뒤의 주석을 어떤 형식으로 적으면 FF의 판에 실제 쓰임이 보이는지 알려 준다.
// 예시(그 값이 화면 어디에 어떤 말로 쓰였는지)는 FF의 패널에서 사람이 적지 않는다. 그것을 아는 쪽은 페이지를 만든 AI라서, AI가 값을 정리할 때 주석에 함께 적게 한다.
// 형식을 화면이 아니라 파일에 적는 것은, AI가 값을 고치려고 파일을 열면 반드시 보게 되기 때문이다. 저장할 때마다 다시 쓰므로 사람이 고친 것은 덮어쓴다.
// 역할, 묶음, 모양의 이름은 src/lib/roles.ts, src/lib/types.ts, src/lib/effects.ts의 목록과 같아야 한다. 목록을 바꾸면 여기도 고친다.
// 안내 안에는 값 블록을 여는 말과 주석을 끝내는 기호를 적지 않는다(파일을 읽는 코드가 그것을 값 블록의 시작이나 주석의 끝으로 읽는다).
const GUIDE = /\/\* ff:guide[\s\S]*?ff:guide 끝 \*\/\n*/g
const GUIDE_TEXT = `/* ff:guide
  이 파일은 FF(디자인 시스템 관리 도구)가 읽고 쓴다. 값 뒤에 붙인 주석은 FF의 판에 설명과 예시로 보인다.
  값을 더하거나 정리할 때 주석도 함께 적는다. 적지 않으면 판에는 지어낸 기본 예시가 보인다.

  의미 색(다른 색을 가리키는 --color-이름)의 주석
    역할(모양): 설명 | 문구 | 모양: 문구
    예) 바탕(줄): 마우스를 올린 메뉴 줄 | 주문 관리
    역할: 글자, 바탕, 테두리, 채움, 상태, 차트
    모양: 글자, 면, 줄, 테두리, 구분선, 버튼, 버튼 글자, 뱃지, 선택 표시, 안내선, 안내 글자, 차트

  의미 글꼴(--type-이름)의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 조작(버튼): 버튼, 입력칸의 이름표 | 저장, 취소 | 이름표: 받는 분
    묶음: 제목, 본문, 보조, 조작, 숫자·코드
    모양: 제목, 문단, 설명, 버튼, 이름표, 메뉴, 고른 메뉴, 탭, 뱃지, 숫자, 코드

  효과(--shadow-이름, --opacity-이름, --blur-이름)의 주석
    종류(모양): 설명 | 문구 | 모양: 문구
    예) 그림자(메뉴): 드롭다운 목록, 알림 | 이름 바꾸기, 복제, 삭제 | 알림: 저장했어요
    종류와 그 모양: 그림자(메뉴, 창, 알림, 카드), 투명도(꺼짐, 가림막, 겹침), 흐림(유리)
    효과의 이름은 단계(sm, md)보다 쓰임(float, dialog, disabled)으로 짓는다.

  간격(--gutter-숫자: 숫자px)과 의미 간격(--spacing-이름: var(--gutter-숫자))의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 버튼(사이): 나란한 버튼 사이 | 취소, 추가
    묶음: 버튼, 입력칸, 목록, 판, 패널, 창
    모양: 사이, 아이콘, 쌓임, 이름표, 칸, 묶음, 버튼, 채운 버튼, 바탕 없는 버튼, 바탕 없는 버튼 사이,
          줄, 줄 아이콘, 줄 좌우, 줄 위아래, 목록 상자, 입력칸, 단위, 나란한 칸, 칩, 제목과 내용, 열 사이,
          격자, 격자 줄, 상자, 버튼 줄, 막대 좌우, 면, 면 좌우, 면 위아래
    간격은 길이 그 자체이고 이름이 곧 px 숫자다(--gutter-8: 8px). 주석을 적지 않는다. 화면에 바로 쓰지 않고, 쓰임마다 의미 간격을 두어 그 이름을 쓴다(gap-actions, px-input-x).
    의미 간격의 이름은 숫자로 시작하지 않는다(--spacing-8이라는 이름은 숫자 클래스 p-8, top-8이 그 값을 따라가게 만든다).
    의미 간격은 (모양)을 적은 값에만 예시가 그려진다.

  크기(--length-숫자: 숫자px)와 의미 크기(높이 --height-이름, 폭 --width-이름, 정사각 --size-이름. 값은 var(--length-숫자))의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 조작(입력칸): 입력칸과 버튼의 높이 | 이름 | 버튼: 취소, 추가
    묶음: 조작, 틀, 견본
    모양: 입력칸, 버튼, 줄, 작은 칸, 전환, 값, 슬라이더, 아이콘 버튼, 아이콘, 체크, 체크 표시, 손잡이, 둥근 손잡이,
          막대, 제목 줄, 글줄, 알림, 카드, 목록, 메뉴, 틀, 열, 색 칸, 미리보기, 색 면, 무대, 막대 그림, 뱃지, 점, 상자
    크기는 길이 그 자체이고 이름이 곧 px 숫자다(--length-32: 32px). 주석을 적지 않는다.
    의미 크기는 길이를 직접 적지 않고 크기 하나를 가리킨다. 화면은 숫자(h-8, w-40, size-4)를 바로 쓰지 않고 의미 크기의 이름을 쓴다(h-control, w-panel, size-icon).
    최소와 최대는 같은 이름을 쓴다. 높이는 min-h-이름과 max-h-이름, 폭은 min-w-(--width-이름)과 max-w-(--width-이름).
    의미 크기의 이름은 단계(sm, lg)보다 쓰임(row, bar, icon-button)으로 짓는다. 같은 길이라도 쓰임이 다르면 이름을 나눈다.
    되풀이해 쓰는 크기에만 이름을 준다. 한 곳에서만 쓰는 길이는 코드에 대괄호로 직접 적는다(max-h-[320px]).
    틀의 문구는 제목, 입력칸의 이름표, 아래 버튼들의 차례로 적는다(의미 색 추가, 이름, 취소, 추가). 제목이 없는 면은 제목 자리에 -를 적는다.
    아이콘 버튼의 문구가 닫기면 X 버튼으로 그린다.
    의미 크기는 (모양)을 적은 값에만 예시가 그려진다.

  설명은 이 값을 화면 어디에 쓰는지다.
  문구는 그 자리에 실제로 적혀 있는 말이다. 지어내지 않고 화면에 있는 말을 옮긴다.
  모양은 그 값이 놓인 자리다. (모양)을 빼면 FF가 이름에서 짐작한다.
  한 값을 여러 자리에 쓰면 뒤에 " | 모양: 문구"를 자리마다 이어 적는다.
  여럿을 늘어놓는 모양(버튼, 버튼 글자, 메뉴, 탭, 뱃지, 숫자, 그림자의 메뉴, 의미 간격의 사이·쌓임·이름표·줄·칸·묶음)은 문구를 쉼표와 빈칸으로 나눈다.
  주석은 값과 같은 줄에 한 줄로 적는다.
  파일 끝의 ff:type 구역은 FF가 저장할 때마다 다시 쓰므로 고치지 않는다.
ff:guide 끝 */`

/** 파일 맨 위의 안내를 지금 것으로 바꿔 넣는다. 없으면 맨 위에 더한다. */
export function withGuide(css: string): string {
  return `${GUIDE_TEXT}\n\n${css.replace(GUIDE, '').trimStart()}`
}

// 의미 글꼴(--type-이름)마다 짧은 클래스(type-이름)를 함께 적어 둔다. 의미 색은 --color-ink라고 정하면 Tailwind가 text-ink를 저절로 만들어 주지만,
// --type-은 Tailwind가 모르는 이름이라 저절로 생기는 클래스가 없다. 클래스가 없으면 코드에서 크기와 굵기를 매번 따로 적게 되고, 정해 둔 조합이 쓰이지 않는다.
// 이 구역은 저장할 때마다 값에서 다시 만든다. 사람이 고친 것은 덮어쓴다. 구역의 처음과 끝을 주석으로 표시해 두어, 그 밖에 적힌 것은 건드리지 않는다.
const CLASSES_START = '/* ff:type 의미 글꼴마다 FF가 만드는 클래스. 저장할 때마다 다시 쓰므로 직접 고치지 않는다. */'
const CLASSES_END = '/* ff:type 끝 */'
const CLASSES = /\n*\/\* ff:type [\s\S]*?\/\* ff:type 끝 \*\/[ \t]*\n?/g
const TYPE_PREFIX = '--type-'
const TRACK_SUFFIX = '--letter-spacing'

/** 의미 글꼴 하나의 클래스. font 한 줄에는 글자 사이가 들어가지 않으므로, 글자 사이 값이 있으면 한 줄 더 적는다. */
export function typeClasses(tokens: Token[]): string {
  const names = new Set(tokens.map((t) => t.name))
  return tokens
    .filter((t) => t.name.startsWith(TYPE_PREFIX) && !t.name.endsWith(TRACK_SUFFIX))
    .map((t) => {
      const track = names.has(t.name + TRACK_SUFFIX) ? `  letter-spacing: var(${t.name}${TRACK_SUFFIX});\n` : ''
      return `@utility type-${t.name.slice(TYPE_PREFIX.length)} {\n  font: var(${t.name});\n${track}}\n`
    })
    .join('')
}

function withTypeClasses(css: string, tokens: Token[]): string {
  const rest = css.replace(CLASSES, '\n').trimEnd()
  const classes = typeClasses(tokens)
  return classes ? `${rest}\n\n${CLASSES_START}\n${classes}${CLASSES_END}\n` : `${rest}\n`
}

export function isValidToken(token: unknown): token is Token {
  if (!token || typeof token !== 'object') return false
  const { name, value, note } = token as Record<string, unknown>
  // 주석 안에 주석을 끝내는 기호나 줄바꿈이 들어가면 파일이 깨진다.
  if (note !== undefined && (typeof note !== 'string' || /\*\/|[\n\r]/.test(note))) return false
  return (
    typeof name === 'string' &&
    typeof value === 'string' &&
    /^--[A-Za-z0-9_-]+$/.test(name) &&
    value.trim().length > 0 &&
    !/[;{}\n\r]/.test(value)
  )
}
