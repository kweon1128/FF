import { Modal } from './ui'

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: '편집',
    keys: [
      ['Ctrl+Z / Ctrl+Shift+Z', '되돌리기 / 다시 실행'],
      ['Ctrl+C / Ctrl+V', '값 복사 / 붙여넣기 (사진은 캔버스에 놓임)'],
      ['Ctrl+D', '복제'],
      ['Ctrl+R, 더블클릭', '이름 바꾸기 (오른쪽 패널의 이름 칸으로 이동)'],
      ['Ctrl+] / Ctrl+[', '값의 순서를 뒤로 / 앞으로'],
      ['I', '스포이드로 색 찍기'],
      ['Delete, Backspace', '삭제'],
    ],
  },
  {
    title: '선택',
    keys: [
      ['누르기, Shift+누르기', '선택 / 여러 개 선택'],
      ['끌기', '영역 선택'],
      ['Tab / Shift+Tab', '다음 / 이전 항목'],
      ['Ctrl+A', '모두 선택'],
      ['Esc', '선택 풀기'],
    ],
  },
  {
    title: '판',
    keys: [
      ['Alt+A / D / W / S', '왼쪽 / 오른쪽 / 위 / 아래 정렬'],
      ['Alt+H / V', '가로 / 세로 가운데 정렬'],
      ['Alt+Shift+H / V', '가로 / 세로 간격 고르게'],
      ['방향키, Shift+방향키', '1px / 10px 이동'],
      ['Shift+끌기', '가로나 세로로만 이동'],
      ['Ctrl+끌기', '붙지 않고 이동'],
      ['Alt+마우스 올림', '선택한 판과의 거리 보기'],
      ['1 ~ 9, 0', '투명도 10 ~ 90%, 100%'],
      ['Ctrl+Shift+L', '잠그기 / 풀기'],
      ['Ctrl+Shift+H', '숨기기'],
    ],
  },
  {
    title: '보기',
    keys: [
      ['스페이스+끌기, 휠', '화면 이동'],
      ['Ctrl+휠, +, -', '확대 / 축소'],
      ['Shift+1 / Shift+2', '전체 / 선택한 것에 맞춤'],
      ['Ctrl+0', '100%'],
      ['Ctrl+\\', '메뉴와 패널 숨기기'],
      ['Ctrl+K', '빠른 실행'],
      ['Ctrl+Shift+/', '단축키 목록'],
    ],
  },
  {
    title: '숫자 칸',
    keys: [
      ['↑ / ↓, Shift+↑ / ↓', '1씩 / 10씩 올리고 내리기'],
      ['이름표 끌기', '값을 연속으로 바꾸기'],
    ],
  },
]

export function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="단축키" wide onClose={onClose}>
      <div className="grid max-h-[70vh] grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-xs font-[650]">{group.title}</h3>
            <dl className="space-y-1.5">
              {group.keys.map(([key, what]) => (
                <div key={key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-soft">{what}</dt>
                  <dd className="shrink-0 rounded-sm bg-hover px-1.5 py-0.5 text-xs">{key}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
