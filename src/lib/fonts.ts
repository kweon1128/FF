import { onFilesChanged } from './watch'

/** 글꼴의 큰 갈래. 대체 글꼴을 무엇으로 붙일지 정한다. */
export type FontType = 'sans' | 'serif' | 'mono'

/** 고른 글꼴이 없을 때 차례로 쓰일 대체 글꼴. 갈래마다 맨 끝은 어느 컴퓨터에나 있는 일반 이름이다. */
export const FALLBACKS: Record<FontType, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, Consolas, monospace',
}

/** 글꼴 종류의 이름으로 흔히 쓰는 것들. 아직 없는 것을 추가 창에서 추천한다. */
export const FONT_ROLES = ['sans', 'serif', 'mono', 'display']

/** 이름에서 갈래를 짐작한다. mono나 code가 들어가면 고정폭, sans 없이 serif가 들어가면 명조, 나머지는 고딕. */
export function guessFontType(name: string): FontType {
  if (/mono|code/.test(name)) return 'mono'
  if (/serif/.test(name) && !/sans/.test(name)) return 'serif'
  return 'sans'
}

/** 따옴표 없이 적어도 되는 이름(영문자로 시작하는 낱말 하나). 빈칸이나 숫자로 시작하는 낱말이 있으면 따옴표가 필요하다. */
const PLAIN = /^[A-Za-z_][A-Za-z0-9_-]*$/

/** 글꼴 이름을 font-family 값에 넣을 수 있게 적는다. */
export function quoteFont(name: string) {
  const n = name.trim().replace(/["';{}]/g, '')
  return PLAIN.test(n) ? n : `"${n}"`
}

/** 맨 앞 글꼴과 대체 글꼴을 이어 font-family 값을 만든다. */
export function fontValue(font: string, tail: string) {
  const first = font.trim() && quoteFont(font)
  // 고른 글꼴이 대체 글꼴에도 들어 있으면(Consolas를 골랐는데 대체에도 Consolas) 한 번만 적는다.
  const rest = tail.split(',').map((p) => p.trim()).filter((p) => p && p !== first)
  return [first, ...rest].filter(Boolean).join(', ')
}

const GENERIC = ['monospace', 'serif', 'sans-serif']
const PROBE = 'mmmmmmmmmmlli 가나다라 0123'
const known = new Map<string, boolean>()
let pen: CanvasRenderingContext2D | null | undefined

function widthOf(family: string) {
  if (pen === undefined) pen = document.createElement('canvas').getContext('2d')
  if (!pen) return 0
  pen.font = `72px ${family}`
  return pen.measureText(PROBE).width
}

/**
 * 이 컴퓨터(또는 이 화면)에서 그 글꼴로 실제로 그려지는지. 없는 글꼴은 조용히 대체 글꼴로 그려지므로,
 * 일반 글꼴 셋 뒤에 각각 붙여 그려 보고 하나라도 폭이 달라지면 있는 것으로 본다.
 */
export function hasFont(name: string) {
  const n = name.trim()
  if (!n) return false
  const hit = known.get(n)
  if (hit !== undefined) return hit
  const found = GENERIC.some((g) => widthOf(`${quoteFont(n)}, ${g}`) !== widthOf(g))
  known.set(n, found)
  return found
}

/** "내 컴퓨터" 묶음에 보여 줄 흔한 글꼴들. 이 가운데 이 컴퓨터에 있는 것만 보여 준다. 브라우저는 깔린 글꼴 전체를 허락 없이 알려 주지 않는다. */
const COMMON = [
  'Pretendard',
  'Pretendard Variable',
  'SUIT',
  'SUIT Variable',
  'Noto Sans KR',
  'Noto Serif KR',
  'Spoqa Han Sans Neo',
  'Malgun Gothic',
  'Apple SD Gothic Neo',
  'NanumGothic',
  'NanumMyeongjo',
  'NanumSquare',
  'Batang',
  'Gulim',
  'Inter',
  'Roboto',
  'Segoe UI',
  'Helvetica Neue',
  'Arial',
  'Verdana',
  'Tahoma',
  'Georgia',
  'Times New Roman',
  'Cambria',
  'Consolas',
  'Cascadia Code',
  'Cascadia Mono',
  'JetBrains Mono',
  'Fira Code',
  'D2Coding',
  'Menlo',
  'SF Mono',
  'Courier New',
]

export function commonFonts() {
  return COMMON.filter(hasFont)
}

/** 추천 글꼴. 널리 쓰이는 무료 글꼴을 성격별로 묶은 것으로, 깔려 있지 않아도 인터넷에서 불러와 견본을 그린다. */
export type CatalogFont = {
  family: string
  type: FontType
  group: string
  /** 이 글꼴에 들어 있는 굵기들. 견본에서 이 굵기들을 나란히 보여 준다. */
  weights: number[]
  /** 한글이 없는 글꼴. 한글은 대체 글꼴로 그려진다. */
  latin?: boolean
  /** 구글 글꼴에서 불러올 때의 이름과 굵기. 없으면 css의 주소에서 불러온다. */
  google?: string
  css?: string
}

/** from부터 to까지 100 단위의 굵기들. */
const range = (from: number, to: number) => Array.from({ length: (to - from) / 100 + 1 }, (_, i) => from + i * 100)

const g = (family: string, type: FontType, group: string, weights: number[], latin = false): CatalogFont => ({
  family,
  type,
  group,
  weights,
  ...(latin ? { latin } : {}),
  // 굵기가 400 하나뿐인 글꼴은 굵기를 적지 않고 청한다.
  google: family.replace(/ /g, '+') + (weights.length > 1 ? `:wght@${weights.join(';')}` : ''),
})

export const CATALOG: CatalogFont[] = [
  { family: 'Pretendard Variable', type: 'sans', group: '담백한 고딕', weights: range(100, 900), css: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css' },
  { family: 'SUIT Variable', type: 'sans', group: '담백한 고딕', weights: range(100, 900), css: 'https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css' },
  g('Noto Sans KR', 'sans', '담백한 고딕', range(100, 900)),
  g('IBM Plex Sans KR', 'sans', '담백한 고딕', range(100, 700)),
  g('Gothic A1', 'sans', '담백한 고딕', range(100, 900)),
  g('Nanum Gothic', 'sans', '부드러운 고딕', [400, 700, 800]),
  g('Gowun Dodum', 'sans', '부드러운 고딕', [400]),
  g('Jua', 'sans', '부드러운 고딕', [400]),
  g('Noto Serif KR', 'serif', '명조', range(200, 900)),
  g('Gowun Batang', 'serif', '명조', [400, 700]),
  g('Nanum Myeongjo', 'serif', '명조', [400, 700, 800]),
  g('Hahmlet', 'serif', '명조', range(100, 900)),
  g('Black Han Sans', 'sans', '제목용', [400]),
  g('Do Hyeon', 'sans', '제목용', [400]),
  g('Inter', 'sans', '영문', range(100, 900), true),
  g('Manrope', 'sans', '영문', range(200, 800), true),
  g('DM Sans', 'sans', '영문', range(100, 900), true),
  g('Space Grotesk', 'sans', '영문', range(300, 700), true),
  g('Playfair Display', 'serif', '영문', range(400, 900), true),
  g('Nanum Gothic Coding', 'mono', '고정폭', [400, 700]),
  g('JetBrains Mono', 'mono', '고정폭', range(100, 800), true),
  g('IBM Plex Mono', 'mono', '고정폭', range(100, 700), true),
]

/**
 * 그 글꼴에 들어 있는 굵기들. 추천 글꼴은 적어 둔 것을, 그 밖의 글꼴은 화면에 불러온 글꼴 정보에서 읽는다.
 * 알 수 없으면(이 컴퓨터에 깔린 글꼴 등) 보통과 굵게 둘만 보여 준다.
 */
export function weightsOf(family: string): number[] {
  const known = CATALOG.find((f) => f.family === family)
  if (known) return known.weights
  const found = new Set<number>()
  for (const face of document.fonts) {
    if (face.family.replace(/^["']|["']$/g, '') !== family) continue
    // 굵기는 '400'이거나, 가변 글꼴이면 '100 900' 같은 범위다.
    const [from, to = from] = face.weight.replace('normal', '400').replace('bold', '700').split(' ').map(Number)
    for (let w = Math.ceil(from / 100) * 100; w <= to; w += 100) found.add(w)
  }
  return found.size > 0 ? [...found].sort((x, y) => x - y) : [400, 700]
}

/** 추천 글꼴을 이 화면에서 그릴 수 있게 불러온다. 글꼴 파일은 실제로 그려질 때 필요한 것만 내려받는다. 한 번만 한다. */
export function loadCatalog() {
  const urls = [
    'https://fonts.googleapis.com/css2?' + CATALOG.filter((f) => f.google).map((f) => 'family=' + f.google).join('&') + '&display=swap',
    ...CATALOG.flatMap((f) => (f.css ? [f.css] : [])),
  ]
  for (const href of urls) {
    if ([...document.head.querySelectorAll('link[data-ff-font]')].some((l) => l.getAttribute('href') === href)) continue
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.ffFont = ''
    document.head.append(link)
  }
}

/** 글꼴 이름이 아니라 "어떤 글꼴이든"을 뜻하는 일반 이름들. */
const GENERIC_NAME = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|BlinkMacSystemFont|inherit|var(.*))$/

/** font-family 값을 맨 앞 글꼴과 나머지(대체 글꼴)로 나눈다. 맨 앞이 일반 이름이면 글꼴은 비고 전부가 대체 글꼴이다. */
export function parseFontValue(value: string): { font: string; tail: string } {
  // 따옴표 안의 쉼표는 이름의 일부다.
  const parts = (value.match(/(?:"[^"]*"|'[^']*'|[^,])+/g) ?? []).map((p) => p.trim()).filter(Boolean)
  const first = (parts[0] ?? '').replace(/^["']|["']$/g, '')
  if (!first || GENERIC_NAME.test(first)) return { font: '', tail: parts.join(', ') }
  return { font: first, tail: parts.slice(1).join(', ') }
}

/** 글꼴의 갈래. 추천 글꼴이면 적어 둔 것을, 아니면 글꼴 이름에서 짐작한다. */
export function typeOfFont(family: string): FontType {
  const known = CATALOG.find((f) => f.family === family)
  if (known) return known.type
  const n = family.toLowerCase()
  if (/mono|code|consolas|courier|menlo|coding/.test(n)) return 'mono'
  if (/sans|gothic|고딕/.test(n)) return 'sans'
  if (/serif|myeongjo|batang|gungsuh|명조|바탕|georgia|times|cambria|garamond/.test(n)) return 'serif'
  return 'sans'
}

/**
 * 새 글꼴 종류에 붙일 이름. 사람이 짓지 않고 고른 글꼴의 갈래로 붙인다(sans, serif, mono).
 * 이미 있으면 고딕과 명조는 display(제목용으로 하나 더 두는 흔한 경우), 그다음은 sans2처럼 번호를 붙인다.
 */
export function nameForFont(family: string, existing: Set<string>) {
  const type = typeOfFont(family)
  const tries = type === 'mono' ? [type] : [type, 'display']
  for (const name of tries) if (!existing.has(name)) return name
  for (let i = 2; ; i++) if (!existing.has(type + i)) return type + i
}

// ── 이 시스템의 글꼴 ──────────────────────────────────
// 디자인 시스템 폴더의 fonts.css가 그 시스템이 쓰는 글꼴을 불러오는 코드다. AI나 사람이 고치고, FF는 읽어서 화면에 불러온다.

let fontSystem = ''
let fontFamilies: string[] = []
const FONTS_FILE = 'fonts.css'

/** fonts.css에 들어 있는 글꼴 이름들. "글꼴 종류 추가" 창의 "이 시스템의 글꼴" 묶음이 된다. */
export function systemFamilies() {
  return fontFamilies
}

function facesIn(css: string) {
  const names: string[] = []
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const m = /font-family\s*:\s*(["']?)([^;"'}]+)\1/.exec(block)
    if (m) names.push(m[2].trim())
  }
  return names
}

/** @import로 불러오는 주소에서 글꼴 이름을 읽는다. 구글 글꼴은 주소에 이름이 있고, 그 밖의 주소는 내용을 받아서 읽는다. */
async function familiesOfImport(href: string) {
  try {
    const url = new URL(href)
    if (url.hostname === 'fonts.googleapis.com') return url.searchParams.getAll('family').map((f) => f.split(':')[0])
    return facesIn(await (await fetch(href)).text())
  } catch {
    return []
  }
}

/** 시스템의 fonts.css를 읽어 화면에 불러오고, 그 안의 글꼴 이름들을 기억한다. 시스템을 열 때와 파일이 밖에서 바뀔 때 부른다. */
export async function loadSystemFonts(name: string) {
  fontSystem = name
  const base = `/api/systems/${encodeURIComponent(name)}/fonts`
  let css = ''
  try {
    const res = await fetch(base)
    if (res.ok) css = (await res.json()).css ?? ''
  } catch {
    // 읽지 못하면 글꼴 없이 둔다.
  }
  if (fontSystem !== name) return
  // 폴더에 넣은 글꼴 파일(./fonts/파일)은 서버가 내어 주는 주소로 바꿔서 불러온다.
  const shown = css.replace(/url\(\s*(["']?)(?:\.\/)?fonts\/([^"')]+)\1\s*\)/g, (_all: string, q: string, file: string) => `url(${q}${base}/${encodeURIComponent(file)}${q})`)
  let style = document.getElementById('ff-system-fonts')
  if (!style) {
    style = document.createElement('style')
    style.id = 'ff-system-fonts'
    document.head.append(style)
  }
  style.textContent = shown
  // 주석 안의 예시 코드는 글꼴로 읽지 않는다.
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const imports = [...css.matchAll(/@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^"')\s;]+))/g)].map((m) => m[1] ?? m[2] ?? m[3])
  const found = [...facesIn(css), ...(await Promise.all(imports.map(familiesOfImport))).flat()]
  if (fontSystem !== name) return
  fontFamilies = [...new Set(found)]
}

onFilesChanged((data) => {
  if (data.file === FONTS_FILE && data.system === fontSystem) void loadSystemFonts(fontSystem)
})

/**
 * 추천 글꼴을 골랐으면 그 글꼴을 불러오는 주소를 fonts.css에 적어 둔다. 이름만 저장하면 이 글꼴을 어디서 가져오는지가
 * 어디에도 남지 않기 때문이다. 이미 시스템에 있는 글꼴이나 추천 목록에 없는 글꼴이면 아무것도 하지 않는다.
 */
export async function recordFont(family: string) {
  const font = CATALOG.find((f) => f.family === family)
  const name = fontSystem
  if (!font || !name || fontFamilies.includes(family)) return
  const url = font.css ?? `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  try {
    await fetch(`/api/systems/${encodeURIComponent(name)}/fonts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
    await loadSystemFonts(name)
  } catch {
    // 적지 못해도 글꼴 종류는 만들어진다.
  }
}

/**
 * 화면에 보여 줄 글꼴 이름. 파일에는 대체 글꼴까지 적지만("SUIT Variable", system-ui, sans-serif), 대체 글꼴은 자동으로 붙는
 * 안전장치라 사람이 볼 것이 아니다. 그래서 정한 글꼴의 이름만 보여 준다. 정한 글꼴 없이 대체 글꼴뿐이면 기기의 기본 글꼴이다.
 */
export function shownFont(value: string) {
  return parseFontValue(value).font || '기기 기본 글꼴'
}

const inkShifts = new Map<string, number>()

/**
 * 그 글을 그 글꼴과 굵기로 썼을 때, 글자의 실제 모양(잉크)의 가운데가 영문 대문자의 가운데보다 얼마나 위에 있는지(글자 크기의 배수).
 * 상자 안의 글자는 대문자 높이를 기준으로 가운데에 놓는데, 한글은 대문자와 높이와 자리가 달라서 그 기준으로는 위나 아래로 치우쳐 보인다.
 * 이 값만큼 아래로 내리면 글자의 모양이 한가운데에 온다. 글꼴이 아직 불려 오지 않았으면 임시 값을 돌려주고 기억하지 않는다.
 */
export function inkShift(family: string, weight: number, text: string) {
  const key = weight + '|' + family + '|' + text
  const hit = inkShifts.get(key)
  if (hit !== undefined) return hit
  if (pen === undefined) pen = document.createElement('canvas').getContext('2d')
  if (!pen) return 0
  const font = `${weight} 100px ${family}`
  pen.font = font
  const cap = pen.measureText('H').actualBoundingBoxAscent
  const ink = pen.measureText(text)
  // 너무 큰 값은 잘못 잰 것으로 보고 누른다.
  const shift = Math.max(-0.12, Math.min(0.12, ((ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2 - cap / 2) / 100))
  try {
    if (document.fonts.check(font, text + 'H')) inkShifts.set(key, shift)
  } catch {
    // 글꼴 이름을 읽지 못하면 기억하지 않는다.
  }
  return shift
}
