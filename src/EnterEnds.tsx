import type { ReactNode } from 'react'

/**
 * 추가 창 안에서 값을 고치는 칸들(그림자의 겹, 곡선의 네 숫자, 애니메이션의 칸들)을 감싼다.
 * 이 안의 입력칸에서 Enter는 그 칸의 값만 끝내고 창을 내지 않는다. 창은 "추가" 버튼으로 낸다.
 * 이 칸들은 적는 동안 값을 바꾸지 않고 칸을 벗어날 때 바꾼다. Enter로 창이 바로 나가면 적는 중인 숫자가 값에 들어가기 전이라, 고치기 전의 값으로 만들어진다.
 */
export function EnterEnds({ children }: { children: ReactNode }) {
  return (
    <div
      onKeyDownCapture={(e) => {
        if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return
        e.preventDefault()
        e.stopPropagation()
        e.target.blur()
      }}
    >
      {children}
    </div>
  )
}
