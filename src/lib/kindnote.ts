// 종류의 이름으로 시작하는 주석을 읽고 쓰는 것. 움직임 판과 화면 크기 판의 종류들이 함께 쓴다(효과, 의미 테두리의 주석과 같은 꼴이다).
//   --transition-duration-glide: 300ms; /* 시간(이동): 캔버스가 판으로 미끄러져 가는 시간 | 의미 색 */
// 종류(모양): 설명 | 문구 | 모양: 문구. 모양을 적지 않은 값은 예시가 없다(의미 간격, 의미 크기, 의미 모서리, 의미 테두리, 겹치는 차례와 같은 규칙이다).

/**
 * 주석 맨 앞의 분류 자리에 적힌 이름. "이름(모양): …"의 이름이다. 그런 꼴이 아니면 null.
 * 괄호가 있는 꼴만 분류로 본다. "참고: 임시 값"이나 "TODO: 정하기"처럼 짧은 낱말과 쌍점으로 시작하는 보통 설명을 분류로 읽지 않으려는 것이다.
 * 분류 이름은 짧아서 여덟 자까지만 본다.
 */
export function headOf(note: string): string | null {
  const m = /^([^:(|,]{1,8})\([^)|]*\)\s*:/.exec(note.trim())
  return m ? m[1].trim() : null
}

/**
 * 주석에 "이름(모양): …"으로 적힌 분류. 목록에 있는 이름이면 그 분류고, 목록에 없는 이름이면 "그 밖"(other)이다. 그런 꼴이 아니면 null(그때는 이름에서 짐작한다).
 * 읽는 쪽은 제 정규식이 맞지 않을 때만 이것을 묻는다(목록에 있는 분류는 제 정규식이 읽는다).
 * 목록에 없는 분류를 이름에서 짐작한 분류에 놓으면, 짐작이 틀렸을 때 값이 엉뚱한 자리에 말없이 놓인다. "그 밖"에 모아 두면 눈에 띈다.
 */
export function groupFromNote<G extends string>(note: string, groups: { id: G; label: string }[], other: G): G | null {
  const head = headOf(note)
  if (head === null) return null
  return groups.find((g) => g.label === head)?.id ?? other
}

export type KindShape<S extends string> = { id: S; label: string; hint: string }
/** 예시 하나. 어떤 요소로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type KindExample<S extends string> = { shape: S; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
// 긴 이름을 먼저 견준다(짧은 이름이 긴 이름의 앞부분으로 읽히지 않게).
const labelsOf = (shapes: KindShape<string>[]) =>
  shapes
    .map((s) => s.label)
    .sort((a, b) => b.length - a.length)
    .join('|')

/**
 * 주석에서 설명과 예시들을 읽는다. 종류의 이름(title)으로 시작하지 않으면 주석 전체가 설명이다.
 * picked는 주석에 직접 적혀 있던 첫 예시의 모양이다. examples는 판에 그릴 예시들이고, 모양을 적지 않은 값은 예시가 없다.
 */
export function readKindNote<S extends string>(title: string, shapes: KindShape<S>[], note: string | undefined): { text: string; picked?: S; words: string; more: KindExample<S>[]; examples: KindExample<S>[] } {
  const all = (note ?? '').trim()
  const own = (label: string) => shapes.find((s) => s.label === label)?.id
  const labels = labelsOf(shapes)
  const m = new RegExp(`^${title}(?:\\((${labels})\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[1] ? own(m[1]) : undefined
  const parts = m ? m[2].split(MARK).map((p) => p.trim()) : [all]
  const words = parts[1] ?? ''
  const head = new RegExp(`^(${labels})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).flatMap((p): KindExample<S>[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 첫 예시의 모양은 주석에 적혀 있던 것만 적는다. 설명도 예시도 없으면 빈 글자(주석을 달지 않는다). */
export function writeKindNote<S extends string>(title: string, shapes: KindShape<S>[], text: string, shape?: S, words = '', more: KindExample<S>[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: S) => shapes.find((s) => s.id === id)!.label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  if (!body && !shape) return ''
  const head = shape ? `${title}(${label(shape)})` : title
  return body ? `${head}: ${body}` : `${head}:`
}
