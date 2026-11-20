// 애니메이션(--animate-이름)이 고를 수 있는, FF가 준비해 둔 움직임들과 그 단계(@keyframes).
// 애니메이션의 값은 "움직임 시간 이징 되풀이" 한 줄이지만(spin 1000ms linear infinite), 움직임의 단계는 여러 줄짜리 글이라 값 한 줄에 들어가지 않는다.
// 그래서 단계는 사람이 적지 않고, 고른 움직임의 것을 FF가 파일 끝의 ff:motion 구역에 대신 적는다(server/tokensCss.ts). 판의 예시도 여기의 단계로 움직인다.
// 움직임마다 그 움직임을 정하는 숫자 하나(세기)를 고칠 수 있다. 올라옴은 거리, 깜박임은 가장 옅을 때의 진하기처럼. 세기는 움직임의 이름 뒤에 붙여 적는다(rise-16).
// 기본 세기면 붙이지 않는다(rise). 값이 한 줄로 남고, 같은 움직임을 세기만 달리해 둘 써도 단계가 따로 적힌다.
// 화면(src)과 서버(server)가 함께 읽는 파일이라 다른 것을 가져오지 않는다.

export type Keyframes = {
  /** 움직임의 이름. 기본 세기일 때의 @keyframes 이름이자 애니메이션 값의 첫 낱말이다. 고르는 목록에도 이 이름을 적는다(코드에 적는 글자와 같다). */
  id: string
  /** 고르는 목록에서 쓰는 같은 이름(UsePicker가 label을 읽는다). */
  label: string
  hint: string
  /** 세기. 그 움직임을 정하는 숫자 하나다. 없는 움직임도 있다(돌기, 나타남). */
  strength?: { label: string; unit: string; base: number }
  /** 단계들. 한 줄에 한 단계다. n은 세기다. */
  frames: (n: number) => string[]
  /** "추가"에서 이 움직임을 고르면 채워지는 값. */
  value: string
}

const OUT = 'cubic-bezier(0, 0, 0.58, 1)'
const IN = 'cubic-bezier(0.42, 0, 1, 1)'
const motion = (k: Omit<Keyframes, 'label'>): Keyframes => ({ ...k, label: k.id })

export const KEYFRAMES: Keyframes[] = [
  motion({ id: 'spin', hint: '제자리에서 계속 돎', frames: () => ['to { transform: rotate(360deg); }'], value: 'spin 1000ms linear infinite' }),
  motion({ id: 'pulse', hint: '옅어졌다가 돌아옴', strength: { label: '가장 옅을 때', unit: '%', base: 50 }, frames: (n) => [`50% { opacity: ${n / 100}; }`], value: 'pulse 2000ms cubic-bezier(0.4, 0, 0.6, 1) infinite' }),
  motion({ id: 'ping', hint: '커지면서 사라짐', strength: { label: '커지는 크기', unit: '%', base: 200 }, frames: (n) => [`75%, 100% { transform: scale(${n / 100}); opacity: 0; }`], value: 'ping 1000ms cubic-bezier(0, 0, 0.2, 1) infinite' }),
  motion({
    id: 'bounce',
    hint: '위아래로 튐',
    strength: { label: '높이', unit: '%', base: 25 },
    frames: (n) => [`0%, 100% { transform: translateY(-${n}%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }`, '50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }'],
    value: 'bounce 1000ms linear infinite',
  }),
  // 빛이 지나가는 자리 표시. 이 움직임을 쓰는 요소는 바탕이 가로로 두 배 넓은 그라데이션이어야 한다(background-size: 200% 100%).
  motion({ id: 'shimmer', hint: '빛이 옆으로 지나감', frames: () => ['from { background-position: 200% 0; }', 'to { background-position: -200% 0; }'], value: 'shimmer 1500ms linear infinite' }),
  motion({ id: 'fade-in', hint: '옅은 데서 또렷해짐', frames: () => ['from { opacity: 0; }'], value: `fade-in 200ms ${OUT} 1` }),
  motion({ id: 'fade-out', hint: '또렷한 데서 옅어져 사라짐', frames: () => ['to { opacity: 0; }'], value: `fade-out 150ms ${IN} 1` }),
  motion({ id: 'rise', hint: '아래에서 올라오며 나타남', strength: { label: '거리', unit: 'px', base: 8 }, frames: (n) => [`from { opacity: 0; transform: translateY(${n}px); }`], value: `rise 200ms ${OUT} 1` }),
  motion({ id: 'pop', hint: '작은 데서 커지며 나타남', strength: { label: '시작 크기', unit: '%', base: 96 }, frames: (n) => [`from { opacity: 0; transform: scale(${n / 100}); }`], value: `pop 150ms ${OUT} 1` }),
  motion({ id: 'slide-in-right', hint: '오른쪽에서 밀려 들어옴', strength: { label: '거리', unit: '%', base: 100 }, frames: (n) => [`from { transform: translateX(${n}%); }`], value: `slide-in-right 300ms ${OUT} 1` }),
  motion({ id: 'slide-in-left', hint: '왼쪽에서 밀려 들어옴', strength: { label: '거리', unit: '%', base: 100 }, frames: (n) => [`from { transform: translateX(-${n}%); }`], value: `slide-in-left 300ms ${OUT} 1` }),
  motion({ id: 'shake', hint: '좌우로 짧게 흔들림', strength: { label: '거리', unit: 'px', base: 4 }, frames: (n) => [`25% { transform: translateX(-${n}px); }`, `75% { transform: translateX(${n}px); }`], value: 'shake 200ms linear 2' }),
]

// 긴 이름을 먼저 견준다(slide-in-right-50이 slide-in의 세기로 읽히지 않게).
const LONGEST_FIRST = [...KEYFRAMES].sort((a, b) => b.id.length - a.id.length)

/** 애니메이션 값의 첫 낱말(rise, rise-16)이 어느 움직임의 어떤 세기인지. 준비된 움직임이 아니면 null. */
export function motionOf(name: string): { motion: Keyframes; strength: number } | null {
  for (const k of LONGEST_FIRST) {
    if (name === k.id) return { motion: k, strength: k.strength?.base ?? 0 }
    const rest = name.startsWith(k.id + '-') ? name.slice(k.id.length + 1) : ''
    if (k.strength && /^\d+$/.test(rest)) return { motion: k, strength: Number(rest) }
  }
  return null
}

/** 움직임과 세기를 값의 첫 낱말로 적는다. 기본 세기면 움직임의 이름만 적는다. */
export const motionName = (k: Keyframes, strength: number) => (k.strength && strength !== k.strength.base ? `${k.id}-${strength}` : k.id)

/** @keyframes 글. names는 값의 첫 낱말들이다(준비된 움직임이 아닌 것은 건너뛴다). prefix를 주면 이름 앞에 붙인다(FF 화면이 예시를 그릴 때, 보여 주는 시스템의 것과 이름이 겹치지 않게 한다). */
export function keyframesCss(names: string[], prefix = ''): string {
  return [...new Set(names)]
    .flatMap((name) => {
      const found = motionOf(name)
      return found ? [`@keyframes ${prefix}${name} {\n${found.motion.frames(found.strength).map((f) => `  ${f}\n`).join('')}}\n`] : []
    })
    .join('')
}
