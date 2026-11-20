// 창 안에서의 되돌리기와 다시 실행.
// 판에서의 Ctrl+Z는 저장된 값을 되돌리지만, 창이 열려 있는 동안에는 아직 저장된 것이 없어서 되돌릴 것이 없었다.
// 창 안에서 고르고 고친 것(설정, 직접 적은 값, 이름, 후보)도 같은 단축키로 되돌릴 수 있게 한다.

import { useEffect, useRef } from 'react'

/** 이 시간(ms) 안에 이어진 변화는 한 번으로 묶는다. 숫자를 한 글자씩 적거나 - + 를 연달아 누른 것을 한 번에 되돌린다. 판의 되돌리기와 같은 값이다. */
const GROUP = 500
/** 기억해 두는 단계의 수. */
const LIMIT = 100

/**
 * 창의 상태(state)를 지켜보다가 Ctrl+Z로 앞의 상태로, Ctrl+Shift+Z(또는 Ctrl+Y)로 다시 뒤의 상태로 돌린다.
 * state는 되돌릴 것들을 모은 값이고(글자로 옮길 수 있어야 한다), restore는 그 값을 받아 창의 상태를 그대로 되돌려 놓는 함수다.
 * "원래대로"처럼 여러 값을 한 번에 바꾼 것도 한 단계로 기억되어 되돌릴 수 있다.
 * 찾기 칸처럼 창의 상태가 아닌 글을 적는 칸에는 data-native-undo를 붙인다. 거기서는 브라우저의 되돌리기가 그대로 동작한다.
 */
export function useUndo<T>(state: T, restore: (state: T) => void) {
  const key = JSON.stringify(state)
  const past = useRef<string[]>([])
  const future = useRef<string[]>([])
  // 지금 상태와, 마지막으로 바뀐 때.
  const now = useRef(key)
  const changedAt = useRef(0)

  useEffect(() => {
    // 되돌리거나 다시 실행해서 바뀐 것은 이미 now에 반영되어 있어서 여기에 걸리지 않는다.
    if (key === now.current) return
    const at = Date.now()
    // 앞의 변화에서 시간이 지났으면 새 분류다. 바뀌기 전의 상태를 기억한다.
    if (at - changedAt.current > GROUP) {
      past.current.push(now.current)
      if (past.current.length > LIMIT) past.current.shift()
    }
    changedAt.current = at
    now.current = key
    future.current = []
  }, [key])

  // 최신 restore를 보도록 담아 둔다.
  const run = useRef(restore)
  run.current = restore

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.code !== 'KeyZ' && e.code !== 'KeyY')) return
      if ((e.target as HTMLElement | null)?.closest?.('[data-native-undo]')) return
      e.preventDefault()
      const redo = e.code === 'KeyY' || e.shiftKey
      const from = redo ? future.current : past.current
      const to = redo ? past.current : future.current
      const next = from.pop()
      if (next === undefined) return
      to.push(now.current)
      now.current = next
      // 다음 변화는 새 분류로 시작한다.
      changedAt.current = 0
      // 적는 중이던 칸에서 손을 뗀다. 칸은 적는 중인 글자를 따로 들고 있어서, 그대로 두면 되돌린 값 대신 적던 글자가 보인다.
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      run.current(JSON.parse(next) as T)
    }
    // 입력칸이 먼저 받아 브라우저의 되돌리기를 하지 않도록 앞 단계에서 받는다.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
