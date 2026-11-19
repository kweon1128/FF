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
// 역할, 묶음, 모양의 이름은 src/lib/roles.ts, src/lib/types.ts, src/lib/effects.ts, src/lib/radius.ts, src/lib/borders.ts, src/lib/layers.ts, src/lib/motion.ts, src/lib/screens.ts의 목록과 같아야 한다. 목록을 바꾸면 여기도 고친다.
// 안내 안에는 값 블록을 여는 말과 주석을 끝내는 기호를 적지 않는다(파일을 읽는 코드가 그것을 값 블록의 시작이나 주석의 끝으로 읽는다).
const GUIDE = /\/\* ff:guide[\s\S]*?ff:guide 끝 \*\/\n*/g
const GUIDE_TEXT = `/* ff:guide
  이 파일은 FF(디자인 시스템 관리 도구)가 읽고 쓴다. 값 뒤에 붙인 주석은 FF의 판에 설명과 예시로 보인다.
  값을 더하거나 정리할 때 주석도 함께 적는다. 적지 않으면 판에는 지어낸 기본 예시가 보인다.

  의미 색(다른 색을 가리키는 --color-이름)의 주석
    역할(모양): 설명 | 문구 | 모양: 문구
    예) 바탕(줄): 마우스를 올린 메뉴 줄 | 주문 관리
    역할: 글자, 바탕, 테두리, 채움, 상태, 차트
    모양: 글자, 바탕, 줄, 테두리, 구분선, 버튼, 버튼 글자, 뱃지, 선택 표시, 안내선, 안내 글자, 차트

  의미 글꼴(--type-이름)의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 컨트롤(버튼): 버튼, 입력칸의 이름표 | 저장, 취소 | 이름표: 받는 분
    묶음: 제목, 본문, 보조, 컨트롤, 숫자·코드
    모양: 제목, 문단, 설명, 버튼, 이름표, 메뉴, 고른 메뉴, 탭, 뱃지, 숫자, 코드

  효과(--shadow-이름, --opacity-이름, --blur-이름)의 주석
    종류(모양): 설명 | 문구 | 모양: 문구
    예) 그림자(메뉴): 고르는 목록, 알림 | 이름 바꾸기, 복제, 삭제 | 알림: 저장했어요
    종류와 그 모양: 그림자(메뉴, 창, 알림, 카드), 투명도(비활성, 끌기, 배경 가림, 겹침), 흐림(유리)
    효과의 이름은 단계(sm, md)보다 쓰임(float, dialog, disabled)으로 짓는다.
    그림자의 창 문구는 제목, 입력칸의 이름표, 아래 버튼들의 순서대로 적는다(새 디자인 시스템, 이름, 취소, 만들기). 입력칸이 없는 창은 이름표 자리에 -를 적는다.

  모서리(--corner-숫자: 숫자px)와 의미 모서리(--radius-이름: var(--corner-숫자))의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 컨트롤(버튼): 버튼, 입력칸 | 취소, 추가 | 입력칸: 이름
    묶음: 컨트롤, 컨테이너, 표시
    모양: 이름표, 선택 이름표, 체크박스, 작은 버튼, 칩, 버튼, 입력칸, 줄, 카드, 메뉴, 창, 슬라이더, 뱃지, 손잡이
    모서리는 둥글기 그 자체이고 이름이 곧 px 숫자다(--corner-6: 6px). 주석을 적지 않는다. 끝이 완전히 둥근 것은 --corner-9999다.
    의미 모서리는 길이를 직접 적지 않고 모서리 하나를 가리킨다. 화면은 단계(rounded-md, rounded-lg)를 쓰지 않고 의미 모서리의 이름을 쓴다(rounded-control, rounded-float, rounded-t-card).
    의미 모서리의 이름은 단계(sm, lg)보다 쓰임(control, row, card, float, pill)으로 짓고, 숫자로 시작하지 않는다. 같은 둥글기라도 쓰임이 다르면 이름을 나눈다.
    되풀이해 쓰는 둥글기에만 이름을 준다. 모서리에서 계산하는 길이는 그 이름에서 계산한다(rounded-[calc(var(--radius-card)-1px)]).
    작은 버튼의 문구가 닫기면 X 버튼으로 그린다.
    이름표는 치수선의 숫자 이름표(안내 색)이고, 선택 이름표는 선택한 것 아래에 붙는 이름표(선택 색)다.
    의미 모서리의 창도 문구를 제목, 입력칸의 이름표, 아래 버튼들의 순서대로 적는다(의미 색 추가, 이름, 취소, 추가).
    의미 모서리는 (모양)을 적은 값에만 예시가 그려진다.

  테두리(--thickness-숫자: 숫자px)와 의미 테두리(테두리 선 --border-width-이름, 외곽선 --outline-width-이름. 값은 var(--thickness-숫자))의 주석
    종류(모양): 설명 | 문구 | 모양: 문구
    예) 테두리(입력칸): 입력칸, 버튼, 목록 상자의 테두리 | 이름 | 버튼: 취소
    종류와 그 모양: 테두리(입력칸, 버튼, 상자, 구분선, 세로 구분선), 외곽선(초점, 표시)
    테두리는 선의 굵기 그 자체이고 이름이 곧 px 숫자다(--thickness-1: 1px). 주석을 적지 않는다.
    의미 테두리는 굵기를 직접 적지 않고 테두리 하나를 가리킨다. 화면은 border, border-t, outline-2처럼 굵기를 바로 쓰지 않고 의미 테두리의 이름을 쓴다(border-edge, border-t-divider, focus-visible:outline-focus).
    의미 테두리의 이름은 굵기(thin, thick)보다 쓰임(edge, divider, focus)으로 짓고, 숫자로 시작하지 않는다. 색 이름과 같으면 안 된다(border-이름과 outline-이름은 색도 읽는다).
    되풀이해 쓰는 선에만 이름을 준다. 한 곳에서만 쓰는 굵기는 대괄호로 직접 적는다(border-[4px]).
    구분선의 문구는 패널의 구역마다 제목=칸에 적힌 값으로 적는다(이름=ink, 설명=글자 색). 세로 구분선은 왼쪽 메뉴의 줄들을 적고 그 뒤에 패널의 구역을 같은 꼴로 적는다(색상, 의미 색, 이름=ink).
    의미 테두리는 (모양)을 적은 값에만 예시가 그려진다.

  겹치는 순서(--z-index-이름: 숫자)의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 화면 위(창): 화면을 가리는 막과 그 위의 창 | 의미 색 추가, 이름, 취소, 추가
    묶음: 화면 위, 요소 위
    모양: 창, 알림, 색 고르는 창, 목록, 목록 바깥 면, 메뉴, 바깥 면, 꼭짓점, 놓일 자리, 선택 이름표, 영역 선택, 안내선, 확대 도구
    값은 순서의 숫자이고 클수록 위다. 화면은 숫자(z-10, z-50, z-[70])를 바로 쓰지 않고 이름을 쓴다(z-dialog, z-listbox).
    이름은 숫자가 아니라 그것이 무엇인지로 짓고(dialog, toast, listbox), 숫자로 시작하지 않는다. 토대를 따로 두지 않는다. 순서의 숫자는 골라 쓰는 재료가 아니라 앞뒤만 뜻한다.
    화면 위는 화면 전체를 놓고 견주는 것(창, 알림, 메뉴, 고르는 목록)이고, 요소 위는 요소 하나나 캔버스 안에서만 견주는 작은 순서(선택 표시, 안내선)다.
    바깥을 누르면 닫히게 덮는 면과 그 위에 뜨는 것은 이름을 짝지어 둘 다 적는다(listbox-backdrop 70, listbox 71). 뜨는 것이 면보다 커야 한다.
    문구: 창은 제목, 이름표, 버튼들. 색 고르는 창은 창의 제목, 이름표, 색 값, 버튼들. 목록과 목록 바깥 면은 창의 제목, 칸의 이름표, 줄들. 메뉴와 바깥 면은 버튼의 말과 줄들. 선택 이름표는 "이름 · 값"과 이웃 줄들. 안내선은 거리와 판의 제목들.
    겹치는 순서는 (모양)을 적은 값에만 예시가 그려진다.

  움직임(시간 --transition-duration-이름, 이징 --ease-이름)의 주석
    종류(모양): 설명 | 문구 | 모양: 문구
    예) 시간(이동): 캔버스가 판으로 미끄러져 가는 시간 | 의미 색
    종류: 시간, 이징. 모양은 둘이 같다: 이동, 바탕, 창, 알림
    시간은 ms로 적고(300ms) 클래스는 duration-이름이다. 이징은 곡선의 네 숫자로 적고(cubic-bezier(0, 0, 0.58, 1)) 클래스는 ease-이름이다.
    이름은 빠르기(fast, slow)보다 쓰임(glide, fade)으로 짓고, 숫자로 시작하지 않는다. 화면은 duration-150처럼 숫자를 바로 쓰지 않고 이름을 쓴다.
    문구: 이동은 움직이는 판의 제목과 그 판의 값 이름들(의미 색, ink, canvas, hairline). 바탕은 메뉴의 줄들. 창은 버튼의 말과 창의 제목. 알림은 알림의 말.
    움직임은 (모양)을 적은 값에만 예시가 그려진다. 예시는 그 줄에 마우스를 올리면 그 값으로 움직인다.

  화면 크기(브레이크포인트 --breakpoint-이름, 컨테이너 너비 --container-이름, 비율 --aspect-이름)의 주석
    종류(모양): 설명 | 문구 | 모양: 문구
    예) 브레이크포인트(나란히): 표와 화면 예시가 좌우로 놓이는 너비 | 표, 화면 예시
    종류와 그 모양: 브레이크포인트(나란히, 옆 메뉴), 컨테이너(페이지, 창), 비율(이미지, 동영상, 카드)
    브레이크포인트와 컨테이너 너비는 Tailwind의 이름(sm, md, lg, xl, 2xl…)을 쓴다. 이름이 곧 코드에 적는 앞머리다(md:flex, @md:flex, max-w-md). 화면은 min-[768px]:처럼 너비를 바로 쓰지 않는다.
    컨테이너 너비의 이름은 의미 크기의 너비(--width-이름)와 같으면 안 된다(w-이름과 max-w-이름이 둘 다 읽는다).
    비율은 가로 / 세로로 적고(16 / 9) 쓰임으로 이름 짓는다(video, card). 클래스는 aspect-이름이다.
    문구: 나란히는 두 영역을 제목=내용으로(단계=xs 12px · sm 14px, 화면 예시=최근 주문). 옆 메뉴는 메뉴의 줄들과 그 옆 영역(제목=내용). 페이지는 제목=내용. 내용은 그 자리에 실제로 적힌 말이고 쉼표를 쓰지 않는다. 창은 제목, 이름표, 버튼들. 카드는 제목.
    화면 크기는 (모양)을 적은 값에만 예시가 그려진다.

  간격(--gutter-숫자: 숫자px)과 의미 간격(--spacing-이름: var(--gutter-숫자))의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 버튼(사이): 나란한 버튼 사이 | 취소, 추가
    묶음: 버튼, 입력칸, 목록, 판, 패널, 창
    모양: 사이, 아이콘, 글줄 사이, 이름표, 칸, 묶음, 버튼, 채운 버튼, 바탕 없는 버튼, 바탕 없는 버튼 사이,
          줄, 줄 아이콘, 줄 좌우, 줄 위아래, 목록 상자, 입력칸, 단위, 나란한 칸, 칩, 제목과 내용, 열 사이,
          격자, 격자 줄, 상자, 버튼 줄, 막대 좌우, 안쪽 여백, 좌우 여백, 위아래 여백
    간격은 길이 그 자체이고 이름이 곧 px 숫자다(--gutter-8: 8px). 주석을 적지 않는다. 화면에 바로 쓰지 않고, 쓰임마다 의미 간격을 두어 그 이름을 쓴다(gap-actions, px-input-x).
    의미 간격의 이름은 숫자로 시작하지 않는다(--spacing-8이라는 이름은 숫자 클래스 p-8, top-8이 그 값을 따라가게 만든다).
    의미 간격은 (모양)을 적은 값에만 예시가 그려진다.

  크기(--length-숫자: 숫자px)와 의미 크기(높이 --height-이름, 너비 --width-이름, 정사각형 --size-이름. 값은 var(--length-숫자))의 주석
    묶음(모양): 설명 | 문구 | 모양: 문구
    예) 컨트롤(입력칸): 입력칸과 버튼의 높이 | 이름 | 버튼: 취소, 추가
    묶음: 컨트롤, 영역
    모양: 입력칸, 버튼, 줄, 작은 입력칸, 전환 버튼, 숫자 칸, 슬라이더, 아이콘 버튼, 아이콘, 체크박스, 체크 표시, 손잡이, 둥근 손잡이,
          상단 바, 제목 줄, 글줄, 알림, 카드, 목록, 메뉴, 창, 열, 고르는 칸, 색 칸, 미리보기, 색 고르는 판, 무대, 자리 표시, 뱃지, 점, 상자
    크기는 길이 그 자체이고 이름이 곧 px 숫자다(--length-32: 32px). 주석을 적지 않는다.
    의미 크기는 길이를 직접 적지 않고 크기 하나를 가리킨다. 화면은 숫자(h-8, w-40, size-4)를 바로 쓰지 않고 의미 크기의 이름을 쓴다(h-control, w-panel, size-icon).
    최소와 최대는 같은 이름을 쓴다. 높이는 min-h-이름과 max-h-이름, 너비는 min-w-(--width-이름)과 max-w-(--width-이름).
    의미 크기의 이름은 단계(sm, lg)보다 쓰임(row, bar, icon-button)으로 짓는다. 같은 길이라도 쓰임이 다르면 이름을 나눈다.
    되풀이해 쓰는 크기에만 이름을 준다. 한 곳에서만 쓰는 길이는 코드에 대괄호로 직접 적는다(max-h-[320px]).
    창의 문구는 제목, 입력칸의 이름표, 아래 버튼들의 순서대로 적는다(의미 색 추가, 이름, 취소, 추가). 제목이 없는 면은 제목 자리에 -를 적는다.
    아이콘 버튼의 문구가 닫기면 X 버튼으로 그린다.
    의미 크기는 (모양)을 적은 값에만 예시가 그려진다.

  설명은 이 값을 화면 어디에 쓰는지다.
  문구는 그 자리에 실제로 적혀 있는 말이다. 지어내지 않고 화면에 있는 말을 옮긴다.
  모양은 그 값이 놓인 자리다. (모양)을 빼면 의미 색, 의미 글꼴, 효과는 FF가 이름에서 짐작해 그리고, 의미 간격, 의미 크기, 의미 모서리, 의미 테두리, 겹치는 순서, 움직임, 화면 크기는 예시를 그리지 않는다.
  예시는 실제 요소를 그린 것이다. 문구에는 그 요소에 실제로 적혀 있는 말을 빠짐없이 적는다(창이면 제목과 이름표와 버튼).
  한 값을 여러 자리에 쓰면 뒤에 " | 모양: 문구"를 자리마다 이어 적는다.
  여럿을 늘어놓는 모양(버튼, 버튼 글자, 메뉴, 탭, 뱃지, 숫자, 그림자의 메뉴, 투명도의 끌기, 의미 간격의 사이·글줄 사이·이름표·줄·칸·묶음, 의미 모서리의 버튼·줄·메뉴·창·뱃지, 의미 테두리의 상자·구분선·옆선)은 문구를 쉼표와 빈칸으로 나눈다.
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
