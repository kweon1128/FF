// 화면 크기(브레이크포인트, 컨테이너 폭, 비율): 종류와 예시의 모양, 값을 읽는 것.
// 층은 하나다. 종류마다 까닭이 다르다.
// 브레이크포인트와 컨테이너 폭은 Tailwind의 이름(sm, md, lg…)을 그대로 쓴다. 이름이 곧 코드에 적는 앞머리이기 때문이다(md:flex, @md:flex).
//   쓰임의 이름을 붙일 수 없다. 한 폭에서 화면의 여러 곳이 함께 바뀌므로 "무엇의 폭"이라고 부를 하나가 없다. 한 벌로 정해 크기의 차례대로 쓰는 값이다.
// 비율은 숫자 하나가 아니라 가로와 세로 둘이라 "값이 곧 이름"인 토대를 만들 수 없고, 쓰임의 이름을 붙인다(video, card).
//   --breakpoint-3xl: 1700px; /* 브레이크포인트(나란히): 표와 화면 예시가 좌우로 놓이는 폭 | 글자 크기, 화면 예시 */

import type { Kind } from './catalog'
import type { KindShape } from './kindnote'

export type LayoutKind = 'breakpoint' | 'container' | 'aspect'

/** 주석 맨 앞에 적는 종류의 이름. */
export const LAYOUT_TITLES: Record<LayoutKind, string> = { breakpoint: '브레이크포인트', container: '컨테이너', aspect: '비율' }

export const isLayoutKind = (kind: Kind) => kind.id === 'breakpoint' || kind.id === 'container' || kind.id === 'aspect'

/** 예시의 모양. 종류마다 고를 수 있는 모양이 다르다. */
export type LayoutShape = 'columns' | 'sidebar' | 'page' | 'dialog' | 'image' | 'video' | 'card'

export const LAYOUT_SHAPES: (KindShape<LayoutShape> & { kind: LayoutKind })[] = [
  { id: 'columns', kind: 'breakpoint', label: '나란히', hint: '이 너비부터 두 영역이 좌우로 놓임' },
  { id: 'sidebar', kind: 'breakpoint', label: '옆 메뉴', hint: '이 너비부터 메뉴가 옆에 놓임' },
  { id: 'page', kind: 'container', label: '페이지', hint: '이 너비까지만 넓어지는 페이지' },
  { id: 'dialog', kind: 'container', label: '창', hint: '이 너비까지만 넓어지는 창' },
  { id: 'image', kind: 'aspect', label: '이미지', hint: '사진이 놓이는 칸' },
  { id: 'video', kind: 'aspect', label: '동영상', hint: '동영상이 놓이는 칸' },
  { id: 'card', kind: 'aspect', label: '카드', hint: '위에 사진이 있는 카드' },
]

export const layoutShapes = (kind: LayoutKind) => LAYOUT_SHAPES.filter((s) => s.kind === kind)

/** 모양마다의 기본 예시 문구(", "로 나눈다). 나란히는 두 영역의 이름, 옆 메뉴는 메뉴의 줄과 영역의 이름, 페이지는 제목, 창은 제목·이름표·버튼들, 카드는 제목이다. */
export const LAYOUT_WORDS: Record<LayoutShape, string> = {
  columns: '목록, 내용',
  sidebar: '홈, 내용',
  page: '제목',
  dialog: '삭제할까요?, 이름, 취소, 삭제',
  image: '',
  video: '',
  card: '카드 제목',
}

/** 폭을 px로 읽는다(768px, 48rem). 읽을 수 없으면 NaN. */
export function pxOf(value: string): number {
  const m = /^(\d*\.?\d+)(px|rem|em)$/.exec(value.trim())
  return m ? Number(m[1]) * (m[2] === 'px' ? 1 : 16) : NaN
}

/** 비율의 가로와 세로("16 / 9", "4/3", "1.5"). 읽을 수 없으면 null. */
export function parseRatio(value: string): [number, number] | null {
  const m = /^(\d*\.?\d+)\s*(?:\/\s*(\d*\.?\d+))?$/.exec(value.trim())
  if (!m) return null
  const w = Number(m[1])
  const h = m[2] === undefined ? 1 : Number(m[2])
  return w > 0 && h > 0 ? [w, h] : null
}

/**
 * 추가 창에서 예시를 고르면 이름 칸에 채워지는 이름(DESIGN.md dialog-defaults). 그 예시가 보여 주는 쓰임의 영문 이름이다.
 * ff-ds가 실제로 쓰는 이름을 따랐고(사이는 actions, 줄은 rows), 쓰는 이름이 없는 예시만 새로 지었다. 그 이름이 이미 있으면 창은 이름 칸을 비워 둔다.
 */
export const LAYOUT_NAMES: Record<LayoutShape, string> = {
  columns: 'columns',
  sidebar: 'sidebar',
  page: 'page',
  dialog: 'dialog',
  image: 'image',
  video: 'video',
  card: 'card',
}
