// 디자인 시스템의 파일이 FF 밖에서 바뀌었다는 서버의 신호를 받는다.
// 신호를 듣는 자리를 화면 코드(App)와 떼어 여기에 둔다. 화면 코드가 고쳐져 새로 갈아 끼워질 때마다
// 거기서 걸어 둔 듣기가 끊겨서, FF의 코드를 고친 뒤로는 밖에서 바뀐 파일을 알아채지 못하는 일이 있었다.

type Changed = { system: string; file: string }

const listeners = new Set<(data: Changed) => void>()

import.meta.hot?.on('ff:changed', (data: Changed) => listeners.forEach((listen) => listen(data)))

/** 파일이 밖에서 바뀔 때마다 부른다. 돌려주는 함수를 부르면 그만 듣는다. */
export function onFilesChanged(listen: (data: Changed) => void) {
  listeners.add(listen)
  return () => void listeners.delete(listen)
}
