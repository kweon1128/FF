import { useContext, useLayoutEffect, type ReactNode } from 'react'
import { WideDialog } from './ui'

/**
 * 추가 창의 두 칸 짜임. 왼쪽에 값을 정하는 칸들, 오른쪽에 그 값이 쓰인 모습(예시)을 둔다.
 * 예시를 칸들 사이에 끼워 두면, 예시의 모양을 바꾸거나 값을 고칠 때마다 예시의 높이가 달라져 창의 높이와 아래 버튼이 함께 움직인다.
 * 그래서 예시는 오른쪽의 고정된 영역에 따로 그린다. 영역의 높이는 왼쪽 칸들의 높이를 따르고(적어도 240px), 그보다 큰 예시는 영역 안에서 스크롤된다.
 * 영역은 값이 정해지기 전에도 자리를 지킨다. 값이 생기는 순간 창의 너비가 바뀌지 않게 하려는 것이다. 그때는 비어 있다(안내 글을 적지 않는다).
 * 이 짜임을 쓰는 창은 너비가 720px로 넓어진다(Modal이 WideDialog로 받는다). 예시가 없는 추가 창은 이것을 쓰지 않고 기본 너비 그대로다.
 * note는 예시 아래에 옅게 적는 한 줄이다(줄여 그렸을 때의 "그림은 1/2").
 */
export function WithExample({ example, note, children }: { example: ReactNode; note?: ReactNode; children: ReactNode }) {
  const setWide = useContext(WideDialog)
  useLayoutEffect(() => {
    setWide(true)
    return () => setWide(false)
  }, [setWide])
  return (
    <div className="grid grid-cols-2 gap-dialog">
      <div className="min-w-0 space-y-fields">{children}</div>
      <div data-example-pane className="relative min-h-[240px] rounded-card bg-workspace">
        <div className="absolute inset-0 flex flex-col overflow-auto p-card">
          {/* 예시는 영역의 가운데에 둔다. 영역보다 크면 위에서부터 보이고 스크롤된다. 움직임의 예시는 여기에 마우스를 올리면 움직인다(group). */}
          <div className="group m-auto w-full">
            {example}
            {example && note && <p className="mt-label type-caption text-ink-faint">{note}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
