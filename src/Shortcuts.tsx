import { Modal } from './ui'

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: '편집',
    keys: [
      ['Ctrl+Z / Ctrl+Shift+Z, Ctrl+Y', '되돌리기 / 다시 실행'],
      ['Ctrl+C / Ctrl+V', '값 복사 / 붙여넣기 (사진은 캔버스에 놓임)'],
      ['Ctrl+Alt+C / Ctrl+Alt+V', '속성 복사 / 붙여넣기'],
      ['Ctrl+D', '복제'],
      ['Ctrl+R, 더블클릭', '이름 바꾸기 (색 여러 개면 번호 다시 매기기)'],
      ['↓ → / ↑ ←, Ctrl+] / Ctrl+[', '값의 순서를 뒤로 / 앞으로 (목록을 통째로 선택했으면 목록을 아래 / 위로)'],
      ['I', '화면에서 색 찍기'],
      ['T', '글 적기 (전체 보기에서 누른 자리에)'],
      ['Delete, Backspace', '삭제'],
    ],
  },
  {
    title: '선택',
    keys: [
      ['누르기, Shift+누르기, Ctrl+누르기', '선택 / 여러 개 선택'],
      ['빈 곳에서 끌기', '영역 선택'],
      ['줄이나 분류 제목 끌기', '순서 바꾸기 (여러 개를 선택했으면 함께)'],
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
      ['1~9, 0', '투명도 10~90%, 100%'],
      ['Ctrl+Shift+L', '잠그기 / 잠금 풀기'],
      ['Ctrl+Shift+H', '숨기기'],
    ],
  },
  {
    title: '보기',
    keys: [
      ['스페이스+끌기, 가운데 버튼 끌기, 휠', '화면 이동 (Shift+휠은 좌우)'],
      ['Ctrl+휠, +, -', '확대 / 축소'],
      ['Shift+1 / Shift+2', '전체 / 선택한 것에 맞춤'],
      ['Ctrl+0', '100%'],
      ["Ctrl+'", '1px 격자 켜기 / 끄기 (800% 이상에서 보임)'],
      ['Ctrl+\\', '메뉴와 패널 숨기기'],
      ['Alt+← / Alt+→', '지나온 자리로 뒤로 / 앞으로'],
      ['Ctrl+K, Ctrl+/', '빠른 실행'],
      ['Ctrl+Shift+/', '단축키 목록'],
    ],
  },
  {
    title: '숫자 칸',
    keys: [
      ['↑ / ↓, Shift+↑ / ↓', '1씩 / 10씩 올리고 내리기'],
      ['이름표 끌기', '값을 연속으로 바꾸기 (판의 위치와 모양 칸)'],
      ['Enter / Esc', '저장하고 벗어나기 / 되돌리고 벗어나기'],
    ],
  },
]

export function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="단축키" size="shortcuts" onClose={onClose}>
      <div className="grid max-h-[70vh] grid-cols-2 gap-groups overflow-y-auto">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-heading type-caption-strong">{group.title}</h3>
            <dl className="space-y-blocks">
              {group.keys.map(([key, what]) => (
                <div key={key} className="flex items-baseline justify-between gap-cells">
                  <dt className="text-ink-soft">{what}</dt>
                  <dd className="shrink-0 rounded-small bg-hover px-chip-x type-caption">{key}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
