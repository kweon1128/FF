// 애니메이션(--animate-이름)이 고를 수 있는, FF가 준비해 둔 움직임들과 그 단계(@keyframes).
// 애니메이션의 값은 "움직임 시간 이징 되풀이" 한 줄이지만(spin 1000ms linear infinite), 움직임의 단계는 여러 줄짜리 글이라 값 한 줄에 들어가지 않는다.
// 그래서 단계는 사람이 적지 않고, 고른 움직임의 것을 FF가 파일 끝의 ff:motion 구역에 대신 적는다(server/tokensCss.ts). 판의 예시도 여기의 단계로 움직인다.
// 화면(src)과 서버(server)가 함께 읽는 파일이라 다른 것을 가져오지 않는다.

export type Keyframes = {
  /** @keyframes의 이름이자 애니메이션 값의 첫 낱말. */
  id: string
  label: string
  hint: string
  /** 단계들. 한 줄에 한 단계다. */
  frames: string[]
  /** "추가"에서 이 움직임을 고르면 채워지는 값. */
  value: string
}

export const KEYFRAMES: Keyframes[] = [
  { id: 'spin', label: '돌기', hint: '제자리에서 계속 돎', frames: ['to { transform: rotate(360deg); }'], value: 'spin 1000ms linear infinite' },
  { id: 'pulse', label: '깜박임', hint: '옅어졌다가 돌아옴', frames: ['50% { opacity: 0.5; }'], value: 'pulse 2000ms cubic-bezier(0.4, 0, 0.6, 1) infinite' },
  { id: 'ping', label: '퍼짐', hint: '커지면서 사라짐', frames: ['75%, 100% { transform: scale(2); opacity: 0; }'], value: 'ping 1000ms cubic-bezier(0, 0, 0.2, 1) infinite' },
  {
    id: 'bounce',
    label: '튕김',
    hint: '위아래로 튐',
    frames: ['0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }', '50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }'],
    value: 'bounce 1000ms linear infinite',
  },
  { id: 'fade-in', label: '나타남', hint: '옅은 데서 또렷해짐', frames: ['from { opacity: 0; }'], value: 'fade-in 200ms cubic-bezier(0, 0, 0.58, 1) 1' },
  { id: 'rise', label: '올라옴', hint: '아래에서 올라오며 나타남', frames: ['from { opacity: 0; transform: translateY(8px); }'], value: 'rise 200ms cubic-bezier(0, 0, 0.58, 1) 1' },
  { id: 'shake', label: '흔들림', hint: '좌우로 짧게 흔들림', frames: ['25% { transform: translateX(-4px); }', '75% { transform: translateX(4px); }'], value: 'shake 200ms linear 2' },
]

/** @keyframes 글. prefix를 주면 이름 앞에 붙인다(FF 화면이 예시를 그릴 때, 보여 주는 시스템의 것과 이름이 겹치지 않게 한다). */
export function keyframesCss(ids: string[], prefix = ''): string {
  return KEYFRAMES.filter((k) => ids.includes(k.id))
    .map((k) => `@keyframes ${prefix}${k.id} {\n${k.frames.map((f) => `  ${f}\n`).join('')}}\n`)
    .join('')
}
