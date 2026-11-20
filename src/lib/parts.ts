// 컴포넌트별 분류.
// 컴포넌트에 딸린 값(의미 간격, 의미 크기, 의미 모서리, 의미 테두리)은 모두 이 목록으로 나눈다.
// 같은 이름의 분류에서 그 컴포넌트의 간격, 크기, 모서리, 테두리를 찾게 하려는 것이다. 판마다 목록이 다르면 "버튼"이 어느 판에는 있고 어느 판에는 없다.
// 컴포넌트에 딸리지 않는 값(색, 글꼴, 효과, 움직임, 겹치는 순서)은 이 목록을 쓰지 않고 그 값의 성격에 맞는 분류를 따로 둔다.
// 주석에는 분류의 이름(label)을 적는다: --spacing-button-x: var(--gutter-12); /* 버튼(버튼): 버튼의 좌우 여백 */

export type Part = 'button' | 'input' | 'list' | 'table' | 'card' | 'board' | 'panel' | 'dialog' | 'page' | 'other'

/** 분류의 순서와 이름. 추가 창과 패널의 "분류" 목록, 판의 "원래대로"가 이 순서를 따른다. */
export const PARTS: { id: Part; label: string }[] = [
  { id: 'button', label: '버튼' },
  { id: 'input', label: '입력칸' },
  { id: 'list', label: '목록' },
  // 판과 패널은 FF 같은 도구의 화면 부품이다. 여느 서비스의 화면에 흔한 표, 카드, 페이지도 분류로 둔다.
  { id: 'table', label: '표' },
  { id: 'card', label: '카드' },
  { id: 'board', label: '판' },
  { id: 'panel', label: '패널' },
  { id: 'dialog', label: '창' },
  { id: 'page', label: '페이지' },
  // 목록에 없는 쓰임. 주석에 목록에 없는 분류가 적힌 값도 여기에 놓인다(kindnote.ts의 groupFromNote).
  { id: 'other', label: '그 밖' },
]

/** 판마다의 분류 목록. 순서와 이름은 같고, 고르는 칸에 옅게 적는 덧글(그 판에서 그 분류에 드는 것)만 판마다 다르다. */
export const partGroups = (hints: Record<Part, string>): { id: Part; label: string; hint: string }[] => PARTS.map((p) => ({ ...p, hint: hints[p.id] }))
