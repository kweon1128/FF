---
version: alpha
name: FF
description: "내 프로젝트의 디자인 시스템을 눈으로 확인하고 고치는 개인용 도구. 도구 자체는 흑백의 조용한 틀이고, 색을 가진 것은 사용자의 디자인 시스템뿐이다. 왼쪽 메뉴, 가운데 미리보기, 오른쪽 편집 패널의 3단 구성에 SUIT 글꼴 14px을 기본으로 쓴다."

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  ink: "#000000"
  ink-soft: "#5c5c5c"
  ink-faint: "#757575"
  canvas: "#ffffff"
  workspace: "#f7f7f5"
  hover: "#f1f1f1"
  hairline: "#e6e6e6"
  hairline-soft: "#f1f1f1"
  selection: "#0d99ff"
  selection-soft: "#e5f4ff"
  on-selection: "#ffffff"
  danger: "#c5221f"
  guide: "#f24822"
  success: "#1ea64a"
  scrim: "#000000"

typography:
  title:
    fontFamily: SUIT Variable
    fontSize: 16px
    fontWeight: 650
    lineHeight: 24px
    letterSpacing: 0
  heading:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 650
    lineHeight: 20px
    letterSpacing: 0
  body:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  label:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 550
    lineHeight: 20px
    letterSpacing: 0
  caption:
    fontFamily: SUIT Variable
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0
  caption-strong:
    fontFamily: SUIT Variable
    fontSize: 12px
    fontWeight: 550
    lineHeight: 16px
    letterSpacing: 0
  code:
    fontFamily: ui-monospace
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  code-sm:
    fontFamily: ui-monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0
  menu:
    fontFamily: SUIT Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0
  menu-strong:
    fontFamily: SUIT Variable
    fontSize: 16px
    fontWeight: 550
    lineHeight: 24px
    letterSpacing: 0

rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px

spacing:
  hair: 1px
  xxs: 2px
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "6": 24px

components:
  top-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: 44px
    padding: 0 12px
  panel-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.menu}"
    width: 220px
    padding: 8px
  panel-inspector:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    width: 280px
    padding: 12px 16px
  workspace:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: 24px
  nav-section-label:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    padding: 12px 8px 4px
  nav-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.menu}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  nav-item-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
    typography: "{typography.menu}"
    rounded: "{rounded.md}"
    height: 32px
  nav-item-selected:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
    typography: "{typography.menu-strong}"
    rounded: "{rounded.md}"
    height: 32px
  tree-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  tree-row-selected:
    backgroundColor: "{colors.selection-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 32px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 12px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 12px
  button-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  button-icon:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    size: 32px
  button-danger-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  segmented-option:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: 24px
  segmented-option-selected:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: 24px
  field-label:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    padding: 0 0 4px
  field-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  field-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  field-input-error:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.danger}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  token-chip:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.sm}"
    padding: 0 4px
  color-swatch:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 64px
  preview-frame:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  preview-frame-caption:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.caption}"
    padding: 4px 0 0
  selection-outline:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.on-selection}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.xs}"
  block-dropzone:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 40px
  empty-state:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
    padding: 24px
  save-status:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
  save-status-saving:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.caption}"
  save-status-error:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
---

## Overview

FF는 내 프로젝트의 디자인 시스템(색, 글꼴, 간격, 컴포넌트, 화면 구조)을 눈으로 확인하고 간단히 고치는 개인용 도구다. 내 컴퓨터에서 실행해 브라우저로 열며, 화면 언어는 한국어, 테마는 밝은 모드 하나다.

이 문서는 **도구 자체의 겉모습**을 정한다. 도구가 관리하는 사용자의 디자인 시스템과는 별개다. 가장 중요한 원칙은 이 둘이 섞여 보이지 않는 것이다. 도구는 흑백과 옅은 회색 선으로만 이루어진 조용한 틀이고, 화면에서 색을 가진 것은 가운데 미리보기 안의 사용자 디자인뿐이다.

형식과 흑백 기반은 피그마 홍보 사이트의 DESIGN.md에서 가져왔다. 다만 그 문서의 큰 제목 글자, 파스텔 색 블록, 알약 모양 버튼은 홍보 페이지용이라 쓰지 않는다.

**핵심 특징:**
- 흑백 틀: `{colors.primary}`(검정)와 `{colors.canvas}`(흰색)가 모든 버튼, 글자, 패널을 맡는다.
- 파랑은 "지금 선택됨"만 뜻한다: `{colors.selection}`은 미리보기에서 선택한 항목의 테두리, 구조 목록의 선택 줄, 입력칸의 포커스에만 쓴다.
- 3단 구성: 왼쪽 메뉴 `{components.panel-nav}`, 가운데 `{components.workspace}`, 오른쪽 `{components.panel-inspector}`.
- SUIT 글꼴 하나, 기본 14px. 크기는 16, 14, 12 세 가지만 쓰고 위계는 굵기(400, 550, 650)로 나눈다. 100 단위(400, 500, 600)와 한 단계씩 올린 값(400, 600, 700)도 써 보았다. 앞의 것은 14px과 12px에서 단계 사이의 차이가 눈에 잘 들어오지 않고(위계를 거의 굵기로만 나누는 화면이라 그 차이가 분명해야 한다), 뒤의 것은 버튼과 이름표가 화면 곳곳에 많아 전체가 무거워진다. 550과 650은 그 사이의 값이다. 가변 글꼴(SUIT Variable)이라 그릴 수 있는 값이고, 굵기가 몇 개로 정해진 글꼴로 바꾸면 가까운 굵기로 뭉치므로 그때는 다시 정해야 한다. 코드에서는 굵기를 따로 적지 않고 `type-이름` 클래스에 담아 쓴다(아래 Typography의 Principles). `font-[550]`처럼 굵기를 바로 적는 것은 사용자의 시스템을 그려 보이는 미리보기 안뿐이다.
- 그림자 대신 1px 선: 면의 구분은 `{colors.hairline}` 선과 `{colors.workspace}` 옅은 회색 바탕으로 한다.
- 값 이름과 코드는 고정폭 글꼴 `{typography.code}`로 표시한다.

## Colors

### Brand & Accent
- **Black** ({colors.primary}): 주요 버튼의 바탕. 한 화면에 주요 버튼은 하나만 둔다.
- **White** ({colors.on-primary}): 검정 버튼 위의 글자.
- **Selection Blue** ({colors.selection}): 선택 테두리, 포커스 테두리 전용. 버튼 바탕이나 장식으로 쓰지 않는다.
- **Selection Soft** ({colors.selection-soft}): 화면 구조 목록에서 선택된 줄의 바탕.
- **On Selection** ({colors.on-selection}): 선택 테두리에 붙는 작은 이름표와 안내선의 거리 숫자처럼, 색을 채운 표시 위의 글자. 코드에서는 `text-white`가 아니라 `text-on-selection`으로 적는다.

### Surface
- **Canvas** ({colors.canvas}): 왼쪽 메뉴, 오른쪽 편집 패널, 상단 바, 미리보기 틀의 바탕.
- **Workspace** ({colors.workspace}): 가운데 영역의 바탕. 흰 미리보기 틀이 이 위에 놓여 구분된다.
- **Hover** ({colors.hover}): 마우스를 올린 줄, 선택된 메뉴 항목, 값 이름표의 바탕.
- **Hairline** ({colors.hairline}): 패널 사이의 선, 입력칸과 버튼의 테두리.
- **Hairline Soft** ({colors.hairline-soft}): 패널 안에서 묶음을 나누는 더 옅은 선.

### Text
- **Ink** ({colors.ink}): 제목, 본문, 입력한 값.
- **Ink Soft** ({colors.ink-soft}): 선택되지 않은 메뉴 항목, 보조 설명.
- **Ink Faint** ({colors.ink-faint}): 묶음 이름, 입력칸 이름, 안내 문구. 흰 바탕에서 읽을 수 있는 가장 옅은 회색이며 이보다 옅은 글자는 쓰지 않는다. 예외는 하나다. 작은 숫자 칸이 비었을 때 보이는 값(placeholder)은 `{colors.ink-faint}` 50%로 적는다. 그 칸은 적힌 값이 회색이라, 비었을 때의 값을 같은 회색으로 두면 적힌 값과 구분되지 않는다.

### Semantic
- **Danger** ({colors.danger}): 삭제 버튼의 글자, 잘못된 입력의 테두리와 안내.
- **Success** ({colors.success}): "저장됨" 표시.
- **Scrim** ({colors.scrim}): 창 뒤를 덮는 검정. 40% 투명도로 쓴다(`bg-scrim/40`). 코드에서 `bg-black/40`으로 적지 않는다.
- **흰색과 검정을 직접 적지 않는다**: FF 화면의 코드는 `text-white`, `bg-white`, `bg-black`을 쓰지 않고 그 자리의 쓰임 이름을 쓴다. 채운 바탕 위의 글자는 `on-primary`, 색을 채운 표시 위의 글자는 `on-selection`, 흰 면은 `canvas`, 가림막은 `scrim`. 사용자의 값을 그려 보이는 미리보기 안은 예외다.

## Typography

### Font Family
- **SUIT Variable**: 한글과 영문이 함께 들어 있는 무료 가변 글꼴. 글꼴 파일을 FF 안에 넣어 인터넷 없이도 같은 모양으로 보이게 한다. 대체 순서는 `SUIT Variable, SUIT, Pretendard, system-ui, sans-serif`.
- **고정폭**: `ui-monospace, Consolas, monospace`. 값 이름(`--color-primary-400`), 색 코드, 파일 경로에만 쓴다.

### Hierarchy

코드에서 쓰는 의미 글꼴은 열 개다. FF의 디자인 시스템 `systems/ff-ds/tokens.css`의 `--type-이름`에 정해 두고, 화면 코드에서는 `type-이름` 클래스 하나로 쓴다. FF에서 `ff-ds`를 열면 의미 글꼴 판에 이 열 개가 보인다.

| 클래스 | 글꼴 | 크기 | 굵기 | 줄 높이 | 쓰임 |
|---|---|---|---|---|---|
| `type-title` | SUIT | 16px | 650 | 24px | 화면과 창의 제목, 색 목록의 이름 (캔버스의 판 제목은 12px이다) |
| `type-heading` | SUIT | 14px | 650 | 20px | 패널에서 고른 항목의 이름, 구역의 제목 |
| `type-body` | SUIT | 14px | 400 | 20px | 본문, 입력한 값 |
| `type-label` | SUIT | 14px | 550 | 20px | 버튼, 입력칸의 이름표, 본문 속 강조 |
| `type-caption` | SUIT | 12px | 400 | 16px | 보조 설명, 판에 적힌 값 |
| `type-caption-strong` | SUIT | 12px | 550 | 16px | 묶음의 이름, 작은 이름표 |
| `type-code` | 고정폭 | 14px | 400 | 20px | 판에 적힌 색 값과 변수 이름, 코드로 적는 입력칸 |
| `type-code-sm` | 고정폭 | 12px | 400 | 16px | 작은 칸의 숫자와 이름 |
| `type-menu` | SUIT | 16px | 400 | 24px | 왼쪽 메뉴의 항목 |
| `type-menu-strong` | SUIT | 16px | 550 | 24px | 왼쪽 메뉴에서 고른 항목 |

### Principles
- **크기는 세 가지뿐이다.** 16, 14, 12px 외의 크기를 새로 만들지 않는다.
- **글자는 의미 글꼴 클래스로만 정한다.** 화면 코드에 `text-sm`, `font-[550]`, `font-mono`처럼 크기, 굵기, 글꼴을 따로 적지 않고 위 표의 `type-이름` 하나를 붙인다. 따로 적으면 정해 둔 조합에 없는 짝이 생기고, 조합을 고쳐도 화면이 따라오지 않는다. 표에 없는 조합이 필요하면 가까운 것에 맞추고, 정말 새 쓰임이면 의미 글꼴을 하나 더한다(왼쪽 메뉴의 `menu`, `menu-strong`이 그렇게 더한 것이다). 예외는 사용자의 값을 보여 주는 견본 문장뿐이다(글꼴 판의 18px 견본).
- **의미 글꼴 클래스는 한 요소에 하나만 붙인다.** 둘을 붙이면 어느 쪽이 이길지가 CSS에 적힌 차례에 달려 있어 믿을 수 없다. 상태에 따라 굵기가 달라지는 자리는 `고름 ? 'type-menu-strong' : 'type-menu'`처럼 통째로 갈아 끼운다. 코드 글꼴로 적는 입력칸은 `inputClass`에 덧붙이지 않고 `monoInputClass`를 쓴다.
- **`font` 한 줄은 글꼴의 다른 설정을 지운다.** `type-이름`은 `font: var(--type-이름)` 한 줄이라, 같은 요소의 `tabular-nums`(숫자 폭 맞춤)를 처음 값으로 되돌린다. 그런 클래스는 `tabular-nums!`처럼 뒤에 `!`를 붙여 쓴다. 부모에 `type-이름`이 있고 자식에 `tabular-nums`가 있는 경우는 괜찮다.
- **줄 높이는 글자 크기에 묶인 짝수 px이다.** 14px 글자는 20px, 12px 글자는 16px, 16px 글자는 24px. 배수(1.0, 1.25 같은)로 적지 않고, 같은 크기의 글자는 어디에 놓이든 같은 줄 높이를 쓴다. FF가 만들어 주는 글자 크기 한 벌의 "보통"과 같은 규칙이다. 버튼이나 높이 32px짜리 줄처럼 높이가 정해진 자리도 줄 높이를 줄이거나 늘려서 맞추지 않고, 높이는 따로 정한 뒤 그 안에서 가운데에 놓는다. 사용자의 값을 그리는 견본도 같다(글꼴 판의 18px 견본 문장은 26px). 줄 높이가 홀수면 16px 아이콘이나 체크박스가 줄의 한가운데에 놓이지 못하고 반 픽셀 어긋난다.
- **왼쪽 메뉴의 항목은 16px이다.** 색상, 글꼴 같은 메뉴 줄과 컴포넌트 목록은 16px, 그 위의 묶음 이름은 14px이다. 줄 높이는 32px 그대로다.
- **읽는 글자는 14px이다.** 왼쪽 메뉴의 묶음 이름, 오른쪽 패널(구역 제목, 입력칸 이름표, 코드 표시 포함), 판 안의 값 이름과 값은 모두 14px이다. 같은 크기 안에서의 구분은 굵기와 색(`{colors.ink-faint}`)으로 한다. 12px은 캔버스 위에 덧붙는 것(판 제목, 선택 이름표, 거리 숫자)과 컴포넌트 화면의 칸 설명, 빠른 실행·단축키 목록의 보조 글자에만 쓴다.
- **위계는 굵기로 나눈다.** 같은 14px에서 400은 본문, 550은 선택과 버튼, 650은 제목이다.
- **영문 대문자 표기를 쓰지 않는다.** 묶음 이름도 한글 그대로 쓴다.
- **고정폭은 코드에만 쓴다.** 설명 문장에는 쓰지 않는다.

## Layout

### Spacing System
- **기준 단위**: 4px.
- **여백과 간격, 높이는 4px의 배수로 정한다.** 화면 배율이 125%나 175%일 때 4px의 배수만 화면 픽셀에 딱 떨어진다(4px → 5픽셀, 7픽셀). 2px이나 6px은 반 픽셀이 남아서 위아래나 좌우 여백이 1픽셀씩 다르게 그려진다. 1px 선과 테두리는 예외다(브라우저가 온전한 픽셀로 그린다). `{spacing.xxs}`(2px)는 4px이 들어갈 수 없을 만큼 작은 자리에만 쓴다.
- **FF가 만들어 주는 것의 규칙은 FF의 화면에도 똑같이 적용한다.** 줄 높이는 짝수 px, 줄 높이는 글자 크기에 묶인 px 값, 높이는 줄 높이에 위아래 여백을 더한 것, 여백은 4px의 배수 같은 규칙은 사용자의 디자인 시스템에만 권하는 것이 아니라 이 도구의 화면이 먼저 지킨다. 결과물에 대한 규칙을 새로 정하거나 바꾸면 FF의 화면도 그 규칙에 맞는지 함께 확인하고 고친다.
- **값**: 간격은 다섯 개다. `{spacing.1}` 4px, `{spacing.2}` 8px, `{spacing.3}` 12px, `{spacing.4}` 16px, `{spacing.6}` 24px. 이 밖의 간격(20px, 32px, 64px…)은 쓰지 않는다. `{spacing.hair}` 1px과 `{spacing.xxs}` 2px은 간격 값이 아니라 선과 아주 좁은 틈에 쓰는 예외다.
- **토대의 이름**: 숫자 이름이다(`--spacing-1: 4px`, `--spacing-2: 8px`, `--spacing-3: 12px`, `--spacing-4: 16px`, `--spacing-6: 24px`). Tailwind의 기본 숫자와 같다. 크기 이름(`sm`, `md`)을 쓰지 않는 이유는 둘이다. Tailwind에서 `--spacing-sm`을 만들면 `max-w-sm` 같은 너비 클래스가 그 값을 대신 집어 가고, 숫자는 값(4px의 몇 배)을 그대로 말해 준다.
- **의미 간격**: 화면은 숫자(`p-2`, `gap-3`)를 바로 쓰지 않고 쓰임의 이름을 쓴다(`px-input-x`, `gap-actions`, `mt-dialog-actions`). 의미 간격은 토대의 값을 가리킨다(`--spacing-actions: var(--spacing-2)`). 그래서 "버튼 안의 아이콘과 글자 사이"만 바꾸고 싶으면 `button-inner`가 가리키는 값만 바꾸면 되고, 같은 4px을 쓰던 "이름표와 입력칸 사이"(`label`)는 그대로다. 숫자를 바로 쓰면 그 숫자를 쓰는 모든 자리가 함께 바뀐다.
  - **이름 서른여섯**(묶음별): 버튼 — `button-x` 12, `button-ghost-x` 8, `button-inner` 4, `actions` 8, `actions-tight` 4. 입력칸 — `input-x` 8, `input-inner` 4, `chip-x` 4, `label` 4, `field-row` 8, `fields` 12, `settings` 16. 목록 — `row-x` 8, `row-inner` 8, `rows` 4, `menu` 4, `nav` 8. 판 — `board` 24, `groups` 24, `header` 16, `heading` 8, `board-row-x` 12, `board-row-y` 8, `columns` 16, `cells` 12, `cells-labeled` 16, `card` 16, `box` 8, `sample` 12. 패널 — `section-x` 16, `section-y` 12, `blocks` 8. 창 — `dialog` 24, `dialog-actions` 16, `popover` 12, `bar-x` 12. 무엇에 쓰는지는 `systems/ff-ds/tokens.css`의 주석과 의미 간격 판에 적혀 있다.
  - **이름을 짓는 규칙**: `-x`, `-y`는 여백의 방향이다(`button-x`, `section-y`, `board-row-x`). `-inner`는 한 물건 안의 부품 사이다(`button-inner`는 버튼 안의 아이콘과 글자 사이, `row-inner`는 줄 안의 아이콘과 글자 사이, `input-inner`는 입력칸 안의 값과 단위 사이). 단수는 그 물건의 안쪽 여백이다(`menu`, `card`, `board`, `dialog`, `popover`, `box`, `sample`). 복수는 같은 것들 사이다(`actions`, `fields`, `rows`, `cells`, `groups`, `blocks`). 제목과 내용 사이는 `heading`(묶음·구역의 제목, 8px)과 `header`(판 머리·창 제목, 16px)다. 처음에는 `row-gap`, `button-icon`, `board-row`, `cells-y`, `title`, `head`였는데, CSS 속성 이름과 겹치거나(`row-gap`) 짝이 맞지 않거나(`board-row`와 `board-row-y`) 둘이 구분되지 않아(`title`과 `head`) 바꿨다. `blocks`가 사이 간격과 상자의 안쪽 여백에 함께 쓰이던 것도 갈라, 안쪽 여백은 `box`와 `sample`이 맡는다.
  - **이름을 나눈 기준**: FF 화면에 간격이 쓰인 427곳을 "무엇과 무엇 사이인가"로 묶으니 쉰 가지 관계가 나왔다. 관계마다 이름을 주면 판이 너무 길고, 많이 합치면 "작게·보통·크게"가 되어 토대와 다를 바 없다. 그래서 늘 함께 움직일 것끼리만 합쳤다(이름표와 입력칸 사이, 입력칸과 안내 글 사이는 `label` 하나).
  - **음수 여백도 같은 이름을 쓴다**: 바탕 없는 버튼을 글줄에 맞출 때는 그 버튼의 좌우 여백만큼 왼쪽으로 당긴다(`-ml-button-ghost-x`). 여백을 바꾸면 당기는 양도 함께 바뀐다.
  - **가리키는 간격을 따라간다**: 토대 간격의 이름을 바꾸면 그것을 가리키던 의미 간격이 새 이름을 따라간다(의미 색, 의미 글꼴과 같다). 의미 간격이 가리키는 간격을 지우려 하면 먼저 묻는다. 토대 간격의 패널 "쓰이는 곳"에는 그것을 가리키는 의미 간격이 "의미 간격"이라는 이름표와 함께 나온다.
  - **컴포넌트의 간격 칸**: 컴포넌트 패널의 좌우 여백, 위아래 여백, 아이콘과 글자 사이 칸은 의미 간격을 먼저 보여 주고 그 아래에 토대 간격을 보여 준다(색 칸이 의미 색을 먼저 보여 주는 것과 같다). 미리보기는 의미 간격을 가리키는 길이로 풀어서 그린다.
  - **이름은 Tailwind의 클래스와 부딪히지 않게 짓는다**: `--spacing-이름`을 만들면 Tailwind는 `p-이름`, `gap-이름`뿐 아니라 `w-이름`, `h-이름`, `inline-이름`, `block-이름` 같은 크기 클래스도 함께 만든다. 격자의 칸 사이를 `grid`라고 지었더니 `inline-grid`가 "가로 크기 12px"이 되어, 화면 배치에 `inline-grid`를 쓰는 숫자 칸의 폭이 12px로 굳고 두 자리 숫자가 잘렸다. 그래서 `cells`로 바꿨다(이름이 딸린 격자의 줄 사이는 `cells-labeled`). 새 이름을 지을 때는 `inline-`, `block-`, `w-`, `h-`, `size-`를 붙였을 때 이미 있는 클래스(`inline-grid`, `inline-flex`, `inline-block`, `w-full`, `w-screen`, `h-full`…)가 되지 않는지 본다.
  - **줄 사이(`rows`)는 떠 있는 목록에도 둔다**: 상단의 시스템 메뉴와 빠른 실행 목록도 줄 사이를 4px 띄운다. 마우스를 올린 바탕이 옆 줄과 붙지 않게 하는 것은 목록이 어디에 있든 같다.
  - **그림 안의 간격**: 사용자의 디자인 시스템을 그려 보이는 그림(판의 예시, 견본, 화면 예시)도 FF 화면과 같은 의미 간격 클래스로 적는다. 다만 그 안에서는 FF의 값이 아니라 **보여 주는 시스템의 값**으로 그려진다. 그림의 뿌리 요소에 그 시스템의 간격 변수(`--spacing-이름: 길이`)를 깔아 두기 때문이다(`PreviewSpaceContext`. 의미 간격은 가리키는 토대의 길이로 풀어서 넣는다). 의미 간격 클래스는 `var(--spacing-이름)`을 읽으므로, 그 시스템이 `button-x`를 24px로 정하면 그림 속 버튼의 여백만 24px이 되고 FF의 버튼은 12px 그대로다. 그 시스템에 없는 이름은 FF의 값이 쓰인다(색에서 그런 이름의 의미 색이 없으면 흰 바탕과 검은 글자를 쓰는 것과 같다). 색과 글꼴은 그 시스템의 것을 읽으면서 간격만 FF의 숫자로 그리면 그림이 그 시스템의 견본이 아니게 된다.
  - **그림에서 이름을 고른 방식**: 버튼의 좌우는 `button-x`, 입력칸의 좌우는 `input-x`, 메뉴 줄은 `row-x`·`rows`·`menu`, 버튼 사이는 `actions`, 이름표와 입력칸 사이는 `label`, 창은 `dialog`·`dialog-actions`, 카드는 `card`. 글이 이어지는 화면 예시에는 딱 맞는 쓰임이 없어서 가까운 이름을 썼다: 이어지는 글 사이 8px은 `blocks`, 덩어리 사이 16px은 `settings`, 큰 묶음 사이 24px은 `groups`. 자리 표시용 막대 사이도 `blocks`와 `fields`다.
  - **숫자가 남은 곳은 하나다**: 글꼴 카드 이름 줄의 오른쪽 자리(`mr-6`). 빼기 버튼의 너비 24px에서 온 값이라 간격이 아니다.
- **규칙 밖으로 남겨 둔 것**: 간격 값이 아니라 자리를 계산한 것은 그대로 둔다. 빠른 실행 창의 위쪽 자리(`pt-[18vh]`, 화면 높이에 비례), 글꼴 견본 문단의 첫 줄 맞춤(`pt-[calc((1lh-1cap)/2)]`), 숫자 칸의 커서 자리(`pr-px`). 들여쓰기처럼 여러 값이 더해진 자리는 여백 값을 새로 만들지 않고 그 값들을 그대로 놓아 만든다(왼쪽 메뉴의 컴포넌트 줄은 32px 여백 대신 아이콘 자리 16px을 비워 둔다).
- 메뉴 줄과 입력칸, 버튼의 높이는 모두 32px로 통일한다.
- 편집 패널 안에서 입력칸 사이는 `{spacing.3}`이다. 구역 사이는 간격으로 띄우지 않고 구분선으로 나누며, 구분선 위아래로 `{spacing.3}`(12px, `section-y`)씩 둔다.
- 가운데 영역의 안쪽 여백은 `{spacing.6}`.

### Grid & Container
화면 전체를 채우는 3단 구성이며 페이지 전체가 스크롤되지 않는다. 각 단이 따로 스크롤된다.

| 영역 | 너비 | 역할 |
|---|---|---|
| 상단 바 | 전체, 높이 44px | 프로젝트 선택, 저장 상태 |
| 왼쪽 메뉴 | 220px 고정 | 화면 이동, 항목 목록 |
| 가운데 | 남는 너비 전부 | 미리보기 |
| 오른쪽 편집 패널 | 280px 고정 | 선택한 항목의 값 편집 |

- 창 너비에 따라 패널이 저절로 접히지는 않는다. 가운데를 넓게 보려면 Ctrl+\로 상단 바, 왼쪽 메뉴, 오른쪽 패널을 함께 숨기고, 다시 누르면 돌아온다. 좁은 화면(모바일)은 지원하지 않는다.
- 아무것도 선택하지 않았을 때 오른쪽 패널은 사라지고 가운데 영역이 그만큼 넓어진다. 항목을 선택하면 다시 나타난다. 조작법을 설명하는 안내 문구는 패널에 넣지 않는다.

### Whitespace Philosophy
여백은 가운데 미리보기에 몰아준다. 좌우 패널은 촘촘하게, 가운데는 넉넉하게 두어 눈이 자연스럽게 사용자의 디자인으로 가게 한다.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (평면) | 선도 그림자도 없음 | 가운데 바탕, 메뉴 줄 |
| 1 (선) | 1px `{colors.hairline}` | 패널 경계, 입력칸, 버튼, 미리보기 틀 |
| 2 (떠 있음) | `shadow-float`: 0 1px 2px 검정 4% + 0 4px 16px 검정 6%, 그리고 1px 선 | 드롭다운 목록 |
| 3 (확인 창) | `shadow-dialog`: 0 2px 4px 검정 4% + 0 8px 32px 검정 10%, 그리고 `{colors.scrim}` 40% | 삭제 확인 같은 창, 색 선택 창(가림막 없이 그림자만) |

그림자는 "화면 위에 잠깐 떠 있는 것"에만 쓴다. 패널과 카드에는 쓰지 않는다. 그림자는 옅은 두 겹이다. 가까이 짧게 지는 겹과 멀리 넓게 퍼지는 겹을 겹쳐야 떠 있는 느낌이 자연스럽고, 진한 한 겹은 무겁다(FF가 사용자에게 권하는 기본값과 같은 규칙이다. 전에는 FF 자신만 한 겹을 쓰고 있었다).

꺼진 버튼의 투명도는 `opacity-disabled`(40%) 하나다. 코드에서는 `disabled:opacity-disabled`로 쓴다. 자리마다 30, 40, 50으로 다르게 적지 않는다.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 2px | 선택 테두리, 이름표 |
| `{rounded.sm}` | 4px | 값 이름표, 전환 버튼의 각 칸 |
| `{rounded.md}` | 6px | 버튼, 입력칸, 메뉴 줄, 색 견본 |
| `{rounded.lg}` | 8px | 미리보기 틀, 드롭다운, 확인 창 |
| `{rounded.full}` | 9999px | 상태 점 |

알약 모양 버튼은 쓰지 않는다. 아이콘은 Lucide 한 종류만 16px 크기, 선 굵기 1.5px로 쓴다. 예외는 셋이다. 16px 체크박스 안의 체크 표시는 12px에 선 굵기 3px(작은 상자 안에서 또렷이 보이게), 캔버스의 판 제목 옆 자물쇠는 12px(12px 글자와 높이를 맞춘다), 의미 글꼴 한 벌 만들기 창의 체크박스는 체크를 직접 그린다.

## Components

### 틀
**`top-bar`**: 높이 44px, 아래쪽에 `{colors.hairline}` 선. 왼쪽에 프로젝트 이름과 전환 메뉴, 오른쪽에 `save-status`.

**`panel-nav`**: 너비 220px, 오른쪽에 `{colors.hairline}` 선. 위에서부터 묶음 이름(`nav-section-label`)과 항목(`nav-item`)이 반복된다.

**`panel-inspector`**: 너비 280px, 왼쪽에 `{colors.hairline}` 선. 구역으로 나뉘며, 구역 사이에만 패널 전체 폭의 1px `{colors.hairline}` 구분선을 둔다. 구역 안에는 구분선을 넣지 않는다. 각 구역은 안쪽 여백이 위아래 12px, 좌우 16px이다. 글자 크기는 모두 14px이다. 읽고 고치는 내용(맨 위 항목 이름 굵기 650, 입력칸, 삭제)과 그것을 설명하는 것(구역 제목 굵기 650, 입력칸 이름표 `{colors.ink-faint}` 굵기 550, 코드 표시 고정폭)을 굵기와 색으로 구분한다. 입력칸은 종류와 관계없이 모두 같은 글꼴과 크기를 쓴다. 입력칸을 눌러 들어가면 적혀 있던 글자가 모두 선택되어 바로 고쳐 쓸 수 있다(이미 들어가 있는 칸을 다시 누르면 평소처럼 커서가 놓인다). 구역의 순서는 항목 이름, 이름, 값, 설명, 쓰이는 곳, 코드다. 쓰이는 곳과 코드 구역은 접고 펼 수 있다. 코드는 처음에 접혀 있어 제목 줄만 보인다. 제목 줄(높이 44px, 오른쪽에 16px 화살표)을 누르면 펼쳐지고 다시 누르면 접힌다. 제목 줄에 마우스를 올리면 `{colors.hover}` 바탕이 패널 왼쪽 끝에서 오른쪽 끝까지, 위아래 구분선 사이를 꽉 채운다(둥근 모서리 없음). 펼친 상태는 브라우저에 기억해서 다른 값을 골라도, 다시 열어도 그대로다.

**`workspace`**: 바탕 `{colors.workspace}`. 맨 위에 화면 제목(`{typography.title}`)과 화면별 버튼, 그 아래에 `preview-frame`.

### 메뉴와 목록
**`nav-item`**: 높이 32px, 아이콘 16px과 글자. 기본은 `{colors.ink-soft}`. 항목 사이에 4px 간격(`rows`)을 두어 마우스를 올린 바탕끼리 붙어 보이지 않게 한다.
- 마우스를 올리면 `nav-item-hover`: 바탕 `{colors.hover}`, 글자 `{colors.ink}`.
- 현재 화면이면 `nav-item-selected`: 바탕 `{colors.hover}`, 글자 `{colors.ink}`, 굵기 550. 파랑을 쓰지 않는다.

**`tree-row`**: 화면 구조 목록의 한 줄. 깊이마다 왼쪽 여백을 16px씩 더한다.
- 선택되면 `tree-row-selected`: 바탕 `{colors.selection-soft}`. 가운데 미리보기의 파란 테두리와 같은 항목임을 색으로 잇는다.

### 버튼
**`button-primary`**: `{colors.primary}` 바탕, `{colors.on-primary}` 글자, 높이 32px. 지금은 검정과 흰색이지만 코드는 `bg-primary text-on-primary`로 적어, 주요 버튼의 색만 따로 바꿀 수 있다. 한 화면에 하나만 둔다(예: "내보내기").

**`button-secondary`**: 흰 바탕, 1px `{colors.hairline}` 테두리. 기본 버튼이며 대부분의 동작에 쓴다(예: "색 추가").

**`button-ghost`**: 테두리 없음. 마우스를 올리면 바탕이 `{colors.hover}`가 된다. 패널 안의 작은 동작에 쓴다.

**`button-icon`**: 32px 정사각형, 아이콘만. 반드시 마우스를 올리면 나오는 설명을 붙인다.

**`button-danger-ghost`**: 삭제 전용. 글자만 `{colors.danger}`.

**`segmented-option`** + **`segmented-option-selected`**: 둘 중 하나를 고르는 전환 버튼(예: 가로/세로, PC/모바일). 전체 바탕은 `{colors.hover}`, 선택된 칸만 흰 바탕과 1px 선. 칸은 좌우 여백 없이 전체 폭을 똑같이 나눠 갖는다. 글자는 두 칸 모두 `{typography.label}`이다(글자 크기 한 벌 만들기 창의 "글자 사이"만 고르지 않은 칸이 `{typography.body}`이고, 선택된 칸의 선을 테두리 대신 1px 그림자 고리로 그린다). 바탕의 안쪽 여백과 칸 사이는 `{spacing.1}`(4px), 칸의 높이는 24px이라 전체 높이는 다른 입력칸과 같은 32px이다. 여백이 2px이면 125% 배율에서 화면 픽셀 2.5개가 되어 선택된 칸이 위나 아래로 치우쳐 보인다.

### 입력칸
**`field-label`**: 입력칸 위의 이름, 14px `{colors.ink-faint}`.

**`field-input`**: 높이 32px, 1px `{colors.hairline}` 테두리. 숫자, 글자, 드롭다운이 모두 같은 모양이다.
- `field-input-focused`: 테두리가 `{colors.selection}`으로 바뀐다. 바탕은 그대로다.
- `field-input-error`: 테두리가 `{colors.danger}`로 바뀌고, 아래에 12px 안내 문구가 붙는다.
- 색 입력칸은 왼쪽에 32px 색 견본을 붙이고, 누르면 견본 옆에 색 선택 창이 열린다.

**`color-uses`**: 색이 쓰인 모습을 보여 주는 견본. 색을 고민하는 순간에 그 색이 실제 화면에서 어떻게 보일지를 바로 알게 하려는 것이다. 위아래 두 장으로 이루어진다. 위는 흰 바탕(가장자리 안쪽에 1px 옅은 선)에 그 색 바탕의 버튼과 비활성 버튼, 그 색으로 쓴 큰 글자(16px 굵기 650)와 작은 글자(12px) 한 줄씩, 그 색 1px 테두리의 상자, 그 색을 흰색에 12% 섞은 옅은 배경 위의 그 색 글자를 놓는다. 아래는 짙은 바탕(`#18181b`)에 똑같은 구성을 같은 순서와 자리로 놓는다. 다른 것은 바탕, 테두리 상자 안의 글자색(밝은 회색), 옅은 배경에 색을 섞는 양(24%)뿐이다. 두 장의 형식이 같아서 같은 자리끼리 견주어 볼 수 있다. 글자를 두 크기로 보여 주는 것은 같은 색이어도 작아지면 덜 읽히기 때문이다. 비활성 버튼은 같은 색을 40%만 진하게 그린다. 견본의 글자는 글꼴 판에 값이 있으면 맨 앞의 글꼴로 쓰고, 없으면 FF의 글꼴 그대로다. 버튼 위의 글자는 흰색과 검정 중 더 잘 읽히는 쪽을 자동으로 고른다. 버튼은 실제로 반응한다. 마우스를 올리면 이 색에서 한 단계 짙은 색, 누르면 두 단계 짙은 색이 된다. 글자색은 평소 색에 맞춰 한 번 정한 그대로이고, 올리거나 눌러도 바뀌지 않는다. 세 색을 버튼 세 개로 늘어놓지 않고 버튼 하나로 직접 만져 보게 한다. 이 두 색은 목록에 지금 들어 있는 다음 단계를 가져오는 것이 아니라 이 색에서 "단계 생성"과 같은 계산으로 바로 만든다. 그래서 색을 바꾸는 동안 함께 따라 바뀌고, 색 선택 창 안의 견본과 예외 색에서도 보인다. 기준 단계는 이름의 단계(500 등)이고, 이름이 단계가 아니면 색의 밝기에 가장 가까운 단계다. 가장 짙은 단계에서는 더 짙은 색이 없어 올려도 눌러도 색이 그대로다. 견본 안은 `preview-frame`과 같이 사용자의 색만 따르고 이 문서의 흑백 규칙을 적용하지 않는다. 버튼과 상자의 높이는 28px, 모서리는 `{rounded.md}`다. 버튼과 상자 안의 글자는 `font-sample`의 버튼처럼 줄 상자의 위아래 여백을 잘라 내고(`text-box: trim-both cap alphabetic`) 가운데에 놓는다. 견본의 글자는 사용자의 글꼴로 그려지는데, 글꼴마다 위아래 여백이 달라 그대로 두면 1~2px씩 치우치기 때문이다. `role-sample`의 입력칸과 버튼도 같다.

**`role-row`**: 의미 색 판의 한 줄. 왼쪽부터 40px 색 견본(`{rounded.md}`, 안쪽 1px 옅은 선), 이름과 가리키는 색(너비 176px. 이름은 14px 굵기 550, 그 아래 가리키는 색의 짧은 이름과, 또 그 아래 그 색의 # 값은 고정폭 `{colors.ink-faint}`), 설명(남는 폭, `{colors.ink-soft}`), 예시(너비 280px)를 16px 간격으로 놓는다. 역할은 줄마다 적지 않고 묶음 제목으로 보여 준다. 가리키는 색이 색상 판에 없으면 견본은 바둑판 무늬만 보이고 가리키는 색의 이름을 `{colors.danger}`로 적고 뒤에 "없어짐"을 붙이며 예시는 비운다. 선택과 호버 표시는 다른 줄 목록과 같다.

**`role-sample`**: 의미 색이 실제로 쓰인 예시. 모서리 `{rounded.md}`, 여백 12px인 상자다. 주변은 흰색과 검정이 아니라 이 디자인 시스템의 기본 바탕과 글자 색으로 그린다. 의미 글꼴의 예시와 같은 방식으로, 줄마다 **모양**과 **문구**가 있고 예시가 여럿일 수 있다. 패널에서 고치지 않고 AI가 파일의 주석에 적는다. 모양은 열두 가지다: 글자(이 색으로 적은 글자), 면(글이 놓이는 바탕), 줄(목록의 세 줄 가운데 이 색을 깐 한 줄), 테두리(입력칸의 테두리), 구분선(면을 나누는 1px 선), 버튼(이 색으로 채운 버튼), 버튼 글자(채운 버튼 위의 글자), 뱃지(옅게 깐 것과 채운 것), 선택 표시(고른 것에 틈 없이 붙는 1px 선, 네 꼭짓점의 6px 사각형, 그 아래의 이름표. FF의 선택 모습을 예시 안에 작게 그린 것이라, 사각형은 판의 실제 선택 표시 7px보다 1px 작다), 안내선(두 상자의 가장자리를 지나는 1px 맞춤선과 두 상자 사이의 간격 숫자. 판을 끌 때의 모습이다), 안내 글자(상태를 알리는 작은 글자), 차트(막대). 선택 이름표와 간격 숫자의 글자는 흰색이 어느 정도 읽히면(대비 2.5 이상) 흰색으로 쓴다. 이런 표시는 밝은 파랑이나 주황 위에 흰 글자를 쓰는 것이 보통이기 때문이다. 모양은 역할이 아니라 줄마다 정한다. 한 역할에도 쓰임이 여럿이라(바탕 역할에 패널의 면도, 마우스를 올린 줄도 있다) 역할로 정하면 `hover`도 `canvas`도 똑같은 면으로 그려져 설명과 맞지 않는다. 고르지 않은 줄은 이름에서 짐작하고(`hover`는 줄, `on-primary`는 버튼 글자, `hairline`은 구분선, `selection`은 선택 표시, `guide`는 안내선), 짐작할 수 없으면 역할의 첫 모양이다(글자, 면, 테두리, 버튼, 뱃지, 차트). 문구에는 이 시스템이 실제로 쓰는 말을 적는다(FF라면 `primary`에 "만들기", `success`에 "저장됨"). 구분선과 차트에는 글자가 없다. 곁에 놓이는 것(다른 줄, 면 안의 본문)은 높이 8px의 옅은 막대로 그린다. 예시 안의 글자는 FF의 글자 규칙(`type-` 클래스)을 쓰지 않고 크기와 굵기를 따로 적는다. 글꼴 종류를 이 시스템의 것으로 물려받아야 하기 때문이다. 저장은 주석에 한다: `상태(안내 글자): 삭제 버튼, 잘못된 입력의 안내 | 이름을 입력해 주세요. | 테두리: 이름`. 역할 뒤의 괄호가 첫 예시의 모양(직접 고른 것만 적힌다), 첫 ` | ` 뒤가 첫 예시의 문구, 그 뒤로 ` | 모양: 문구`가 예시마다 이어진다. 설명에 쓰임이 여럿 적힌 색은 쓰임마다 예시를 하나씩 둔다(`canvas`가 왼쪽 메뉴, 오른쪽 패널, 상단 바, 판에 쓰이면 넷). 판에서는 위아래로 8px 띄워 쌓는다. 주석을 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다. 손으로 적은 주석은 빈칸이 빠지거나 더 들어가기 쉽고, 문구가 없는 예시는 세로줄 둘이 붙어 적히기 때문이다.

**`ref-picker`**: 색상 판의 색 가운데 하나를 고르는 곳. 목록마다 이름(`{colors.ink-faint}`)과 그 아래 한 줄 11칸의 작은 정사각형 견본(모서리 `{rounded.sm}`, 간격 4px)을 놓는다. 예외 색은 맨 아래다. 고른 색은 칸 안쪽에 2px `{colors.selection}` 선과 그 안의 1px 흰 선, 마우스를 올린 색은 같은 자리에 2px `{colors.ink}` 선으로 표시한다. 선을 칸 안쪽에 그려서 옆 칸과 닿지 않는다. 높이가 224px를 넘으면 그 안에서 스크롤한다.

**`color-swatch-checker`**: 색 견본 뒤에 까는 바둑판 무늬. `#d9d9d9`와 흰색이 번갈아 놓이며 한 칸은 8px(작은 견본과 막대는 6px)이다. 반투명한 색의 투명한 정도를 보여 주기 위한 것으로, 색을 보여 주는 견본에만 쓴다.

**`color-picker`**: 색 선택 창. 브라우저의 기본 창을 쓰지 않고 직접 그린다. 너비 248px, 안쪽 여백 12px, 모서리 `{rounded.lg}`, 3단계 그림자. 위에서부터 채도·밝기 면(높이 144px, 왼쪽 위는 흰색, 오른쪽 위는 고른 색조의 가장 선명한 색, 아래는 검정), 스포이드 버튼과 무지개 색조 막대(높이 12px), 투명도를 고를 수 있는 곳에서는 그 아래에 투명도 막대(바둑판 무늬 위에 투명에서 지금 색으로 이어지는 띠)와 색 값 칸 옆의 투명도(%) 칸, 지금 색의 견본과 색 값 입력칸(#은 적지 않고 16진수 여섯 자리만 보인다. #이 붙은 값을 붙여넣어도 숫자만 남는다), 그리고 "이 디자인 시스템의 색" 견본이 놓인다. 견본은 색상 판처럼 목록마다 한 줄이다. 한 줄에 11칸이라 50부터 950까지가 한 줄에 들어가고, 줄끼리 같은 단계가 위아래로 맞는다. 목록의 순서는 색상 판과 같고 예외 색은 맨 아래 줄이다. 줄 사이와 칸 사이는 4px, 높이는 160px까지이고 넘치면 스크롤한다. 견본에 마우스를 올리면 이름과 값(`gray-500 · #757575`)이 뜬다. 면과 막대의 손잡이는 피그마와 같은 16px 원으로, 4px 두께의 흰 고리 가운데로 그 자리의 색이 보이고 옅은 그림자가 붙는다. 면과 막대 위에서 마우스 커서는 바뀌지 않는다. 끄는 동안 손잡이는 마우스를 바로 따라온다. 끌거나 견본을 누르는 즉시 값에 반영된다. 견본의 왼쪽에 뜨고 자리가 없으면 오른쪽에 뜬다. 창이 열려 있는 동안 I를 누르면 스포이드가 켜진다("색 목록 추가" 창 안에서 열었을 때도 같다). 스포이드로 색을 찍는 동안에는 화면을 눌러도 창이 닫히지 않는다. 바깥을 누르거나 Esc를 누르면 닫힌다. 견본 격자에서 지금 색과 같은 견본은 `{colors.selection}` 테두리로 표시한다.

**`unit-input`**: 숫자에 단위가 붙는 값의 칸(17px, 0.02em, 200ms). 단위는 숫자 바로 뒤에 `{spacing.1}`(4px) 띄워 보여 주되(`{colors.ink-soft}`) 고칠 수 없게 고정하고, 숫자만 고친다. 딱 붙이면 고칠 수 있는 숫자와 고정된 단위가 한 덩어리로 읽힌다. 단위까지 직접 적게 하면 17처럼 숫자만 적었을 때 값이 되지 않고, 단위를 지우다 만 값이 저장되기 때문이다. 숫자 칸의 폭을 적힌 글자 수에 맞춰서 단위가 숫자에 붙어 다니고, 칸의 빈 곳을 눌러도 숫자를 고칠 수 있다. 숫자와 소수점(글자 사이 간격은 맨 앞의 -도)만 적히고, 단위를 함께 적거나 붙여 넣어도 숫자만 남는다. ↑↓로 1씩(소수는 0.1씩, Shift는 10배) 바꾼다. 기본 값의 패널에서 값이 숫자 하나에 단위 하나인 것(글자 크기, 줄 높이, 간격, 둥글기, 테두리 굵기, 흐림, 화면 폭, 너비, 글자 사이 간격, 시간)은 모두 이 칸이다. 단위는 지금 값의 것(px, rem, em, ms, s, %)을 그대로 쓰고 이 칸에서 바꿀 수는 없다. 그림자나 `clamp()`처럼 숫자 하나가 아닌 값, 굵기나 투명도처럼 단위가 없는 값은 적힌 그대로 고치는 보통의 칸이다. 칸을 누르면 숫자가 모두 선택된다(작은 칸뿐 아니라 패널의 칸도). 숫자 칸은 값을 통째로 바꿔 적는 일이 대부분이라, 누른 뒤 바로 새 값을 적을 수 있어야 한다.

**`checkbox`**: 16px 정사각형, 모서리 `{rounded.sm}`. 꺼져 있으면 흰 바탕에 1px `{colors.ink-faint}` 테두리, 켜져 있으면 검정 바탕에 흰 체크 표시. 브라우저의 기본 체크박스는 화면 배율에 따라 글자와 높이가 어긋나 보여서 쓰지 않고 직접 그린다. 상자는 옆 글자 줄의 세로 한가운데에 놓고, 글자와의 간격은 8px이다. 글자가 두 줄이 되면 첫 줄에 맞춘다.

**`token-chip`**: 값 이름을 보여주는 작은 이름표(예: `primary-400`). 고정폭 글꼴, 바탕 `{colors.hover}`.

### 미리보기
**`color-swatch`**: 높이 64px의 색 면과 그 아래 이름. 색 면의 가장자리 안쪽에 1px 옅은 선(검정 10%)을 그려 흰색에 가까운 색도 보이게 한다. 선은 면 바깥으로 나가지 않고, 어떤 색 위에서도 그 색보다 조금 어둡게 보인다.

**`preview-frame`**: 사용자의 실제 컴포넌트가 놓이는 흰 틀. 안쪽 여백 24px, 1px 선. **이 틀 안에는 이 문서의 규칙이 적용되지 않는다.** 틀 안은 사용자의 디자인 시스템 값만 따른다.

**`preview-frame-caption`**: 틀 아래의 상태 이름(예: "마우스 올림").

**`selection-outline`**: 선택한 항목을 두르는 1px `{colors.selection}` 선. 항목의 가장자리에 틈 없이 딱 붙인다. 피그마처럼 항목의 모서리가 둥글어도 선은 항상 각진 사각형이다(호버 선도 같다). 판에서 고른 항목의 네 꼭짓점에는 7px 흰 사각형(1px `{colors.selection}` 테두리)을 둔다. 항목 바로 아래 가운데에 "이름 · 값"을 담은 작은 파란 이름표가 붙는다(예: `primary-500 · #888888`). 이름표는 주변에 무엇이 있든 가장 위에 겹쳐 보인다. 항목 아래에 이름과 값이 따로 적혀 있어도(색 견본, 컴포넌트 칸) 그 글자를 숨기지 않고 그대로 둔 채 이름표를 위에 겹친다. 항목과 떨어진 선은 쓰지 않는다.

**`hover-outline`**: 선택할 수 있는 항목에 마우스를 올리면 같은 자리에 2px `{colors.selection}` 선만 나타난다. 꼭짓점 사각형과 이름표는 없고 바탕색도 바꾸지 않는다. 피그마와 같이, 호버는 두꺼운 선으로, 선택은 얇은 선에 꼭짓점과 이름표로 구분한다. 이미 선택된 항목에 마우스를 올리면 꼭짓점과 이름표는 그대로 두고 선만 2px로 두꺼워진다.

**`add-tile`**: 항목을 추가하는 점선 상자. 1px 점선 `{colors.hairline}` 테두리 안에 + 아이콘만 둔다. 점선은 6px 긋고 5px 띄운다(브라우저의 기본 점선은 너무 촘촘해서 직접 그린다). 마우스를 올리면 점선이 사라지고 바탕이 `{colors.hover}`가 된다. **이제 항목을 추가하는 데에는 쓰지 않는다.** 목록 끝에 늘 한 줄의 자리를 차지하고, 값이 없는 묶음에서도 빈 상자가 남아 공간이 아깝고 보기에도 어수선하기 때문이다. 기본 값은 묶음 제목 줄의 "추가" 버튼으로 추가한다(아래 "추가"). 컴포넌트 화면의 종류와 크기도 이름 줄의 버튼으로 추가한다. 점선 상자는 색상 판에서 아직 없는 목록의 자리를 보여 주는 데에만 남아 있다.

**`block-dropzone`**: 화면 구조에서 "블록 넣기" 자리. 1px 점선 `{colors.hairline}`, 높이 40px.

### 상태
**`empty-state`**: 아직 아무것도 없을 때. 제목 한 줄과 버튼 하나(예: "첫 색 목록을 만들어 보세요" / "목록 추가"). 설명 문장은 넣지 않는다. FF는 빈 상태에서 시작하므로 모든 화면에 반드시 있어야 한다.

**`save-status`**: 상단 바 오른쪽의 "저장됨" 또는 "저장 중…" 표시. "저장 중…"은 `{colors.ink-faint}`, "저장됨"은 `{colors.success}`, 저장하지 못했을 때의 안내는 `{colors.danger}`다. 값은 고치는 즉시 파일에 저장되므로 저장 버튼은 두지 않는다.

## Screens

모든 화면은 같은 3단 틀을 쓰고, 세 영역의 내용만 바뀐다.

### 왼쪽 메뉴 (공통)
- **전체 보기** (맨 위, 도구를 열면 처음 보이는 화면)
- **기본 값**: 색상, 의미 색, 글꼴, 의미 글꼴, 간격, 의미 간격, 모서리, 테두리, 효과, 화면 크기, 움직임 (열한 개)
- **만들기**: 컴포넌트, 화면 구조, 아이콘·이미지. 컴포넌트 화면에서는 메뉴 항목 바로 아래에 컴포넌트 목록과 "컴포넌트 추가"가 펼쳐진다.

### 전체 보기
모든 기본 값을 한 판에 펼쳐 놓고 자유롭게 이동하며 보는 넓은 화면이다. 가운데 영역 전체가 캔버스이며 안쪽 여백이 없다.
- **판**: 기본 값 화면 하나가 각각 하나의 흰 판(너비는 560px, 색상 판은 1380px, 의미 색 판, 글꼴 판, 의미 글꼴 판은 960px로 판마다 정해져 있고 바꿀 수 없다. 글꼴 판은 글자 크기의 견본 문장이 가장 큰 단계에서도 말줄임표 없이 들어가도록 넓다, 1px 선, 모서리 8px)이다. 판 왼쪽 위 바깥에 12px `{colors.ink-faint}` 제목이 붙는다.
- **조작**: 휠은 위아래 이동, Shift+휠은 좌우 이동, Ctrl+휠은 마우스 위치 기준 확대·축소(휠 한 칸에 약 15%), 스페이스를 누른 채 끌면 화면 이동.
- **영역 선택**: 스페이스 없이 끌면 1px `{colors.selection}` 선과 옅은 파랑(10%) 면의 사각형이 그려지고, 끄는 동안 바로 선택된다. 항목은 영역에 걸치면, 판은 영역 안에 통째로 들어오면 선택된다. 판이 통째로 잡히면 판만 선택되고 그 안의 항목은 따로 선택되지 않는다. 그래서 오른쪽 패널도 판을 기준으로 뜬다(잠근 판은 선택되지 않으므로 그 안의 항목이 선택된다). Shift를 누른 채 끌면 지금 선택에 더한다.
- **판 선택**: 판 제목을 누르면 그 판이 선택되고 Shift로 여러 개를 고른다. 선택된 판은 1px `{colors.selection}` 선과 꼭짓점 사각형이 붙고 제목이 파랑이 된다. 선택한 판 중 하나의 제목을 끌면 모두 함께 이동한다.
- **판 선택(누르기)**: 판 제목이나 판 안의 여백을 누르기만 해도 그 판이 선택된다. 제목이나 여백을 잡고 끌면 판이 움직인다. 제목 위에서 마우스 커서는 바뀌지 않는다.
- **판 호버**: 판에 마우스를 올리면 `hover-outline`과 같은 2px `{colors.selection}` 선이 나타난다. 판 안의 항목 위에서는 항목의 선만 보인다.
- **판 편집 패널**: 판을 선택하면 오른쪽에 피그마와 같은 구역이 나온다. **위치**에는 정렬 버튼 6개(`button-icon`, 2개 이상 선택했을 때만 쓸 수 있다)와 X·Y, **배치**에는 크기(W는 판마다 정해져 있고 H는 내용에 따라 정해져, 둘 다 보여 주기만 한다)와 가로·세로 간격(2개 이상일 때)이 있다. 그 아래로 **모양**(투명도 0~100%, 모서리), **채우기**(색), **테두리**(색, 굵기 0~20)가 이어진다. 이 값들은 판마다 `ff.canvas.json`에 저장되고, 고치지 않은 판은 기본 모양(흰 바탕, 1px `{colors.hairline}` 선, 모서리 8px)을 따른다. 판의 투명도를 낮춰도 선택 표시는 흐려지지 않는다. 색 칸은 왼쪽 견본을 누르면 색 선택 창이 열리고 오른쪽에 #rrggbb를 적는다. 숫자 칸은 앞에 짧은 이름표가 붙고, 값이 서로 다르면 "서로 다름"을 보여 준다. 칸을 벗어나거나 Enter를 누르면 반영한다.
- **단축키**: 키는 피그마와 같다. 입력칸에 글자를 쓰는 중이거나 확인 창이 떠 있으면 동작하지 않는다. 다만 빠른 실행(Ctrl+K, Ctrl+/), 단축키 목록(Ctrl+Shift+/), 메뉴와 패널 숨기기(Ctrl+\)는 글자를 쓰는 중에도 동작한다(확인 창이 떠 있으면 이것들도 동작하지 않는다).

| 키 | 동작 |
|---|---|
| Alt+A / D / W / S | 선택한 판을 왼쪽 / 오른쪽 / 위 / 아래로 정렬 (판 2개 이상) |
| Alt+H / V | 가로 / 세로 가운데 정렬 |
| Alt+Shift+H / V (Ctrl+Alt+H / V도 같음) | 가로 / 세로 간격을 고르게 (판 3개 이상). 양 끝의 판은 그대로 두고 사이를 나눈다. |
| 방향키, Shift+방향키 | 선택한 판을 1px / 10px 이동 |
| Ctrl+A | 모두 선택 (캔버스에서는 숨기지 않은 판과 사진이 모두 선택되고, 값은 전체 보기에서는 모든 값, 기본 값 화면에서는 그 화면의 값이 함께 선택된다. 컴포넌트 화면에서는 모든 칸) |
| Esc | 선택 풀기 |
| Ctrl+Z / Ctrl+Shift+Z (또는 Ctrl+Y) | 되돌리기 / 다시 실행. 값, 컴포넌트, 판 위치의 변경을 100단계까지 기억하고 파일에도 반영한다. 0.5초 안에 이어진 변경은 한 번으로 묶는다. 되돌리거나 다시 실행하면 그 때문에 바뀐 것(값, 판, 사진, 컴포넌트의 칸)이 선택된 상태가 되어 무엇이 달라졌는지 바로 보인다. 지워진 것만 있을 때는 남아 있던 선택을 그대로 둔다. 디자인 시스템을 바꾸거나 새로 고치면 기록이 비워진다. |
| Delete, Backspace | 선택한 값 삭제. 확인 창 없이 바로 지운다. 컴포넌트가 쓰고 있거나, 함께 지우지 않는 의미 색·의미 글꼴이 가리키는 값이 섞여 있을 때만 확인 창이 뜬다. |
| Ctrl+C / Ctrl+V | 선택한 값을 복사 / 붙여넣기. 클립보드에는 CSS 변수 선언(`--color-primary-500: #3b82f6;`) 그대로 담겨서 다른 디자인 시스템이나 코드에도 붙일 수 있다. 붙인 값은 같은 종류의 맨 끝에 들어간다. 이름이 같은 값이 이미 있거나 FF가 읽지 못한 선언이 섞여 있으면 "붙여넣기" 창이 먼저 뜬다. 이름이 같은 값은 덮어쓸지(기본) 따로 만들지(이름 뒤에 copy) 고른다. 읽지 못한 선언(FF가 아는 종류의 이름이 아니거나 대문자·밑줄이 있는 것)은 이름과 값을 목록으로 보여 주고, 그중 값이 색인 것은 이름 앞에 `--color-`를 붙여 가져올지 고른다(`--blue_500` → `--color-blue-500`). 정할 것이 없으면 창 없이 바로 붙는다. FF에서 복사한 것을 그대로 붙이는 것은 복제로 보아 묻지 않고 copy를 붙여 따로 만든다. 색 값을 선택해 둔 채 붙이면 그 색이 속한 목록으로 들어간다. |
| Ctrl+Alt+C / Ctrl+Alt+V | 속성 복사 / 붙여넣기(피그마와 같다). 이름과 자리는 그대로 두고 속성만 옮긴다. 값은 그 값을 같은 종류의 다른 값들에(색은 색에만), 판은 모양(투명도, 모서리, 채우기, 테두리 색과 굵기)을 선택한 판들에, 컴포넌트 칸은 바탕색·글자색·테두리색을 선택한 칸들에 입힌다. 복사해 둔 속성은 FF 안에만 있고 새로 고치면 사라진다. |
| Ctrl+D | 복제. 선택한 값 바로 뒤에 같은 값을 하나 더 만든다(이름 뒤에 copy). 한 색 목록을 통째로 골랐으면 목록을 복제해 바로 아래에 `이름-copy`라는 새 목록을 만든다. 컴포넌트 화면에서는 선택한 칸의 종류를 복제한다. |
| Ctrl+R, 더블클릭 | 이름 바꾸기. 따로 입력창을 띄우지 않고 오른쪽 패널의 이름 칸으로 커서를 옮겨 글자를 모두 고른 상태로 둔다. 값을 하나만 선택했을 때 동작한다. 컴포넌트 화면에서는 선택한 칸의 종류 이름으로 가고, 종류나 크기의 이름을 더블클릭하면 그 이름 칸으로 간다. 값을 여러 개 선택했으면 화면 가운데에 "번호 N개 다시 매기기" 창이 뜬다. 칸은 시작 번호와 끝 번호 둘뿐이다. 이름의 앞부분(목록 이름)은 그대로 두고, 두 번호 사이를 개수에 맞게 나눠 붙인다. 11개에 50~950이면 50, 100, 200 … 900, 950이 되고, 9개에 100~900이면 100, 200 … 900이 된다. 개수와 맞아떨어지지 않으면 고르게 나눈 뒤 반올림한다. 여러 목록을 함께 골랐으면 목록마다 따로 매긴다. 처음 열 때의 번호는 색 11개면 50과 950, 10개면 50과 900, 그 밖의 색은 100과 개수×100, 색이 아니면 1과 개수다. 아래에 바뀐 이름을 미리 보여 주며, 겹치는 이름이 있으면 빨갛게 표시하고 바꾸기 버튼을 막는다. 여러 개 선택 패널의 "번호 다시 매기기" 버튼으로도 열린다. Ctrl+R은 어떤 경우에도 새로 고침으로 쓰지 않는다(실수로 눌러도 화면이 다시 불리지 않는다. 새로 고침은 F5). |
| Ctrl+] / Ctrl+[ | 선택한 값을 같은 묶음(같은 종류) 안에서 한 칸 뒤 / 앞으로 옮긴다. 묶음을 통째로 골랐으면 그 묶음(색 목록, 의미 색·의미 글꼴·의미 간격의 묶음, 판 안의 종류)을 옮긴다. 차례가 값의 크기로 정해지는 값(글자 크기, 간격, 색 목록 안의 단계 등)은 옮겨지지 않는다. 한 색 목록을 통째로 골랐으면 그 목록을 한 칸 아래 / 위로 옮긴다. |
| Tab / Shift+Tab | 선택을 다음 / 이전 항목으로 옮긴다 (무언가 선택되어 있을 때) |
| I | 스포이드. 화면에서 찍은 색을 선택한 색 값에 넣는다. 색 값이 없고 판을 선택했으면 판의 채우기에 넣는다. 크롬 계열 브라우저에서만 된다. |
| 1 ~ 9, 0 | 선택한 판의 투명도를 10 ~ 90%, 100%로 |
| Ctrl+Shift+L / Ctrl+Shift+H | 선택한 판을 잠그기·풀기 / 숨기기 |
| Shift+끌기 / Ctrl+끌기 | 판을 가로나 세로로만 이동 / 다른 판에 붙지 않고 이동 |
| Alt+마우스 올림 | 선택한 판들과 마우스를 올린 판 사이의 거리를 숫자로 보여 준다. 방식은 피그마와 같다. 선은 한쪽의 가장자리 한가운데에서 시작해 다른 쪽의 가장자리가 있는 자리까지 긋는다. 떨어져 있는 방향의 선은 둘 중 좁은 쪽의 한가운데에서 나간다. 떨어져 있는 방향으로는 마주 보는 가장자리 사이를, 걸쳐 있는 방향으로는 상대가 선택보다 바깥으로 나간 쪽의 차이를 잰다. 선택이 상대보다 넓어 상대가 그 안쪽에 들어와 있으면, 거꾸로 상대의 양쪽 가장자리에서 선택의 가장자리로 선을 긋는다. 그래서 넓은 것과 좁은 것 중 어느 쪽을 선택했든 좁은 쪽에서 넓은 쪽으로 선이 나가는 같은 그림이 된다. 선의 끝이 상대의 바깥에 떨어지면 상대의 가장자리를 점선으로 그 끝까지 늘인다. 점선은 화면에서 6px 긋고 4px 띄운다. 숫자 이름표는 선의 한가운데에 두되, 선이 길어 한가운데가 화면 밖이면 화면에 보이는 부분의 한가운데로 옮긴다. 선이 통째로 화면 밖에 있으면 선에서 가장 가까운 화면 가장자리에 숫자를 붙인다. 그래서 숫자는 언제나 화면에 보인다(간격 맞춤의 숫자도 같다). 재는 동안 상대에는 호버 선 대신 안내선 색의 1px 선을 두른다. |
| Ctrl+K (Ctrl+/도 같음) | 빠른 실행 |
| Ctrl+Shift+/ | 단축키 목록 |
| Ctrl+\ | 상단 바, 왼쪽 메뉴, 오른쪽 패널을 숨기고 가운데만 보기. 다시 누르면 돌아온다. |
| Shift+1 / Shift+2 | 전체 / 선택한 것이 보이게 화면 맞춤 |
| Ctrl+0, +, - | 100%, 확대, 축소 |
| Ctrl+' | 1px 격자 켜기 / 끄기 |

- **붙기와 안내선**: 판을 끌 때 다른 판의 왼쪽·가운데·오른쪽(위·가운데·아래)에 화면 기준 6px 안으로 가까워지면 그 자리에 붙고, 맞은 자리에 1px `{colors.guide}` 선이 그어진다. 옆에 나란히 놓인 판들과 간격이 같아지는 자리(양옆 두 판의 한가운데, 또는 옆의 두 판 사이와 같은 간격)에도 붙고, 이때는 같아진 간격마다 선과 그 간격의 숫자가 보인다. 거리 재기의 선과 숫자 이름표도 같은 색이다. 선택의 파랑과 헷갈리지 않게 하려는 것이며, 삭제의 빨강(`{colors.danger}`)보다 밝은 피그마의 안내선 색이라 캔버스 위에서 잘 보인다. 이 색은 안내선과 거리 재기에만 쓴다.
- **잠금과 숨기기**: 잠근 판은 선택은 되지만 끌기, 방향키, 정렬, 영역 선택으로 움직이지 않고 제목 옆에 자물쇠가 붙는다. 숨긴 판은 캔버스에서 사라진다. 둘 다 왼쪽 메뉴의 그 줄 오른쪽에 아이콘이 생기고, 누르면 풀리거나 다시 보인다. 숨긴 판의 메뉴를 눌러도 다시 보인다. 판 편집 패널의 제목 줄에도 잠그기·숨기기 버튼이 있다. 상태는 `ff.canvas.json`에 저장한다.
- **숫자 칸**: 숫자 칸에서 ↑↓를 누르면 1씩, Shift와 함께면 10씩 바뀐다. 칸 앞의 이름표(X, W 등)를 좌우로 끌면 끈 만큼 값이 바뀐다(Shift는 10배). 기본 값의 값 입력칸도 `16px`, `1.5`처럼 숫자 하나로 된 값이면 ↑↓로 바뀐다(소수는 0.1씩).
- **사진**: 캔버스에서 Ctrl+V로 사진을 붙이면 보고 있는 화면 가운데에 놓인다(너비가 800px보다 크면 800px로 줄여 놓는다). 참고 이미지나 시안을 옆에 두고 보는 용도다. 사진은 판처럼 누르면 선택되고, 끌어서 옮기고, 영역 선택·정렬·방향키·붙기가 똑같이 동작한다. 선택한 사진의 꼭짓점 사각형을 끌면 비율을 지킨 채 크기가 바뀐다. Delete나 Backspace로 지우며 확인 창은 없다(되돌리기로 살릴 수 있다). 오른쪽 패널에는 위치(X, Y)와 크기(W를 고치면 H가 비율대로 따라온다)가 있다. 파일은 디자인 시스템 폴더의 `images/`에, 놓인 자리는 `ff.canvas.json`에 저장한다. 캔버스에서 지워도 파일은 남는다.
- **끌 때 화면 따라가기**: 판이나 사진을 끌거나, 크기를 바꾸거나, 영역 선택을 하는 중에 마우스가 캔버스 가장자리 32px 안으로 오거나 밖으로 나가면 화면이 그쪽으로 계속 움직인다. 처음에는 천천히 움직이고 멀리 나갈수록 빨라진다(나간 거리의 제곱에 비례하며, 170px을 더 나가면 가장 빠른 한 장면 28px이 된다). 스페이스로 화면을 옮기는 중에는 동작하지 않는다.
- **주석**: `tokens.css`의 `@theme` 안에 적힌 주석은 FF가 저장해도 없어지지 않는다. 값 위에 적힌 주석과 같은 줄 뒤에 붙은 주석은 그 값을 따라가고(순서가 바뀌어도 함께 움직인다), 값을 지우면 그 주석도 함께 지워진다. 값의 이름을 바꾸면 그 값에 붙어 있던 주석은 없어진다.
- **FF 밖에서 바뀐 파일**: 디자인 시스템의 파일(`tokens.css`, `components.json`, `ff.canvas.json`)이 FF 밖에서 바뀌면(AI가 고치거나 편집기로 고친 경우) FF가 바로 알아채고 다시 불러온 뒤 "파일이 밖에서 바뀌어 다시 불러왔어요"라는 알림을 띄운다. FF가 들고 있던 예전 내용으로 덮어쓰지 않기 위해서다. 다시 불러온 뒤에는 밖에서 바뀐 것(새로 생기거나 값이 달라진 값, 없으면 자리가 바뀐 판)이 선택된 상태가 되고, 알림에 몇 개가 바뀌고 없어졌는지 적힌다. 바뀌기 전의 모습은 되돌리기 기록에 남아서, AI가 고친 것이 마음에 들지 않으면 Ctrl+Z 한 번으로 물리고 Ctrl+Shift+Z로 다시 받아들일 수 있다. 저장하는 순간에도 한 번 더 확인해서, 그 사이에 파일이 바뀌어 있으면 저장하지 않고 다시 불러오며 방금 고친 것은 반영되지 않았다고 알린다.
- **저장**: 판의 위치는 디자인 시스템 폴더의 `ff.canvas.json`에 저장한다. 보는 위치와 확대 비율은 브라우저에만 기억한다.
- **편집**: 판 안의 항목을 누르면 선택되고 오른쪽 패널에서 고친다. 추가도 판 안에서 한다. 빈 곳을 누르면 선택이 풀린다.
- **선 굵기 유지**: 선택과 호버의 선, 꼭짓점 사각형, 이름표, 판 제목은 확대 비율과 관계없이 화면에서 같은 크기(1px, 2px, 7px)로 보인다. 축소해도 가늘어지지 않는다.
- **정수 px**: 판과 사진의 자리, 사진의 크기는 항상 정수 px이다. 확대하거나 축소한 채로 끌어도, 가운데 정렬이나 간격 맞춤을 해도 소수가 남지 않게 반올림한다. 그래서 1px 격자의 선과 판의 가장자리가 어긋나지 않는다.
- **확대 범위**: 10%에서 1600%까지. 1px 선이나 모서리를 자세히 볼 수 있을 만큼만 확대된다.
- **1px 격자**: Ctrl+'로 켜고 끈다(피그마와 같다). 캔버스의 1px마다 옅은 선(검정 6%)을 그어 판과 그 안의 내용 위에 겹쳐 보여 준다. 800% 이상으로 확대했을 때만 보이고, 그보다 작으면 켜 두어도 보이지 않는다. 켠 상태는 브라우저에 기억한다.
- **확대 표시**: 오른쪽 아래에 축소, 비율(누르면 100%), 확대 버튼을 둔다. 캔버스 위에 떠 있으므로 2단계 그림자를 쓴다.

- **판이 길어질 때**: 값을 추가하는 등으로 판이 길어지면, 그 아래에 좌우로 걸쳐 있던 판과 사진을 아래로 밀어 겹치지 않게 한다. 원래 간격이 80px보다 좁았으면 그 간격을 그대로 지키고, 넓었으면 80px까지 좁아진 뒤부터 민다. 밀린 것이 또 다른 것에 닿으면 이어서 민다. 판이 다시 짧아져도 끌어올리지 않는다. 길어지기 전에 이미 겹쳐 있던 것은 일부러 겹친 것으로 보고 그대로 두고, 잠근 판은 밀지 않는다. 밀어낸 것은 값을 추가한 것과 함께 한 번의 되돌리기로 물린다.

### 기본 값 화면
기본 값 화면은 따로 있는 화면이 아니라 전체 보기의 한 부분이다. 왼쪽 메뉴에서 색상·글꼴 등을 누르면 같은 캔버스에서 그 판이 화면에 맞게 보이도록 0.3초 동안 부드럽게 이동한다(100%까지만 확대). 이때 그 판이 선택되어 오른쪽 패널이 열리고, 판은 패널을 뺀 나머지 영역의 가운데에 온다. 옆의 판도 그대로 보이고, 이동·확대·선택·단축키는 전체 보기와 같다. "전체 보기"를 누르면 모든 판이 보이게 맞춘다. 처음 열 때는 지난번에 보던 위치를 그대로 둔다.

**FF의 디자인 시스템은 `ff-ds`다**: FF 자신의 화면이 쓰는 값(색, 글꼴, 간격, 효과와 `type-이름` 클래스)은 FF가 관리하는 디자인 시스템 `systems/ff-ds`에 있다. `src/index.css`는 그 값 파일(`systems/ff-ds/tokens.css`)을 그대로 가져다 쓰고(`@import`), 같은 값을 따로 적지 않는다. 예전에는 `index.css`와 시험용 시스템 `ff-test`에 같은 값을 손으로 똑같이 적어 두었는데, 두 곳에 적으니 값이 어긋났다(안내선 색이 서로 달랐다). `ff-test`는 처음부터 FF의 값을 담고 있었으므로 이름을 `ff-ds`로 바꾸고 하나로 합쳤다.
- **FF에서 `ff-ds`의 값을 고치면 FF 자신의 화면이 바로 바뀐다.** 저장되는 순간 스타일만 다시 읽고 화면은 새로 고쳐지지 않는다. 개발 서버는 다른 시스템 폴더는 지켜보지 않고 `systems/ff-ds/tokens.css`만 지켜본다.
- **FF의 규칙을 바꾼다는 것은 `ff-ds`를 바꾼다는 것이다.** 이 문서는 그 값들이 왜 그렇게 정해졌는지를 적는다. 값 자체와 "어디에 쓰는지"(주석의 설명과 예시)는 `ff-ds`의 파일에 있고, FF에서 `ff-ds`를 열면 판으로 보인다.
- **조심할 것**: `ff-ds`에서 값의 이름을 바꾸거나 지우면 FF의 화면이 그 값을 잃는다(코드는 `text-ink`, `px-button-x`처럼 이름으로 쓴다). 시험해 볼 것은 `ff-ds`가 아닌 다른 시스템에서 한다.

**토대와 의미(판을 나누는 규칙)**: 기본 값에는 두 층이 있다.
- **토대**: 고를 수 있는 값들이다. 이름과 단계는 Tailwind를 따른다(`gray-500`, `text-sm`, `spacing-2`). 그래서 `tokens.css`가 Tailwind 프로젝트에 그대로 들어가고, AI가 이미 아는 방식으로 읽힌다.
- **의미**: 그 값을 어디에 쓰는지다. 쓰임으로 이름 붙인다(`ink`, `type-label`, `shadow-float`). 코드와 AI는 의미 이름을 쓴다.
- **의미 층은 모든 종류에 있다.** 의미 층이 있는지는 하나로 가린다. **쓰임 하나의 값을 바꿨을 때 다른 쓰임이 따라 바뀌지 않는가.** 메뉴의 그림자를 바꿔도 창의 그림자는 그대로다(의미 층이 있다). 값 옆에 "어디에 쓰는지"를 설명과 예시로 적어 둔 것은 의미 층이 아니다. 그 값을 바꾸면 적혀 있는 쓰임이 모두 함께 바뀐다.
- **토대 층은 있는 종류와 없는 종류가 있다.** 여러 쓰임이 같은 값을 나눠 쓰는 종류에 둔다. 색(`gray-900`을 글자와 테두리와 버튼이 나눠 쓴다), 글꼴(크기 셋과 굵기 셋으로 조합 열 개를 만든다), 간격(8px을 버튼 사이와 입력칸 여백이 나눠 쓴다). 쓰임마다 값이 따로인 종류는 토대 없이 의미에 값을 바로 적는다. 그림자, 투명도, 흐림. 메뉴의 그림자와 창의 그림자는 서로 나눠 쓰는 값이 아니다.
- **토대가 있는 종류는 판이 둘이다**(토대 판과 의미 판). 의미는 토대의 값을 가리킨다(`--color-ink: var(--color-black)`). **토대가 없는 종류는 판이 하나다**(그 판이 의미 판이다).
- **지금의 상태**: 색은 색상 판(토대)과 의미 색 판(의미). 글꼴은 글꼴 판(토대)과 의미 글꼴 판(의미). 간격은 간격 판(토대)과 의미 간격 판(의미). 효과는 효과 판 하나(의미. 토대 없음). 모서리, 테두리, 화면 크기, 움직임은 판을 만들 때 이 기준으로 정한다.

화면과 그 안의 종류는 다음과 같다. 변수 이름의 앞부분은 Tailwind v4 규칙을 따른다.

| 화면 | 종류 |
|---|---|
| 색상 | 색(`--color-`) |
| 글꼴 | 글꼴 종류(`--font-`), 글자 크기와 그에 묶인 줄 높이, 글자 사이(`--text-`, `--text-이름--line-height`, `--text-이름--letter-spacing`), 굵기(`--font-weight-`) |
| 간격 | 간격(`--spacing-숫자`) |
| 의미 색 | 의미 색(`--color-이름: var(--color-…)`) |
| 의미 글꼴 | 의미 글꼴(`--type-`) |
| 의미 간격 | 의미 간격(`--spacing-이름: var(--spacing-숫자)`) |
| 모서리 | 모서리(`--radius-`) |
| 테두리 | 테두리 굵기(`--border-width-`) |
| 효과 | 그림자(`--shadow-`), 투명도(`--opacity-`), 흐림(`--blur-`) |
| 화면 크기 | 화면 폭 기준(`--breakpoint-`), 최대 너비(`--container-`), 비율(`--aspect-`), 겹치는 순서(`--z-`) |
| 움직임 | 움직임 시간(`--duration-`), 움직임 흐름(`--ease-`) |

- **여러 개 선택**: Shift(또는 Ctrl)를 누른 채 누르면 선택에 더하거나 뺀다. 여러 개를 선택하면 이름표와 꼭짓점 없이 1px 선만 두르고, 오른쪽 패널은 개수, 선택한 이름들, "번호 다시 매기기"를 보여준다. 여러 단계를 같은 값으로 맞출 일이 없으므로 값을 한 번에 바꾸는 칸은 두지 않는다.
- **가운데**: 색상은 목록별 `color-swatch` 격자, 글꼴은 실제 크기로 쓴 예시 문장, 간격은 칸 끝까지 그은 띠(`{colors.guide}` 30%, 띠의 높이가 그 간격), 모서리는 둥글기가 적용된 사각형.
- **접기**: 색상 판 오른쪽 위의 "접기"를 누르면 모든 색 견본 아래의 이름과 값 글자가 한꺼번에 숨겨져 색만 보이고, 버튼이 "펼치기"로 바뀐다. 목록마다 따로 접지 않고 판 전체를 접거나 펼친다. 접은 상태에서도 색을 고르면 뜨는 파란 이름표와 오른쪽 패널로 이름과 값을 볼 수 있다. 접은 상태는 보는 방식일 뿐이라 파일이 아니라 브라우저에 기억한다.
- **목록 지우기**: 색이 둘 이상인 목록을 이름을 눌러 통째로 고른 뒤 Delete를 누르면 색과 함께 목록도 없어진다(한 번에 색을 둘 이상 지워 목록이 비면 목록도 지운다). 하나 남은 색을 지워 목록이 빈 경우에는 빈 목록이 남는다. 색이 하나뿐인 목록은 이름을 눌러 골라 지워도 빈 목록이 남는다.
- **쓰인 모습**: 색이 쓰인 모습(`color-uses` 견본)은 색 선택 창 안에서 보여 준다(색 값 칸과 "이 디자인 시스템의 색" 사이). 색을 끄는 동안 견본이 바로 따라 바뀌고, "색 목록 추가"·"예외 색 추가" 창에서 색을 고를 때도 같은 창이라 쓰인 모습을 보며 고를 수 있다. 오른쪽 패널에는 "쓰인 모습" 구역을 두지 않는다. 판의 채우기·테두리 색을 고를 때는 디자인 시스템의 색이 아니므로 보여 주지 않는다.
- **예외 색**: `white`, `black`처럼 단계 목록에 속하지 않는 낱개 색을 모아 두는 목록. 색상 판에 처음부터 있고, 색이 하나도 없어도 없어지지 않는다. 처음에는 맨 아래에 놓이고, 색이 있으면 다른 목록처럼 이름을 끌어 옮길 수 있다(비어 있을 때는 맨 아래다). 다른 목록처럼 "목록 추가"로 만들지 않고, 목록을 지울 수도 없다. 목록 안의 색은 크기의 차례가 없는 낱개 색이라 칸을 끌어서(또는 Ctrl+[ ]로) 차례를 바꾼다. 끄는 칸은 40%로 옅어지고 놓일 자리에 `{colors.selection}` 세로선이 보인다. 목록 이름 옆의 + 버튼을 누르면 이름과 색을 묻는 창이 뜬다. 이름은 영문 소문자와 숫자만 쓴다(하이픈이 있으면 그 앞부분이 목록 이름이 되기 때문이다). 색을 비워 두면 추천 색이 쓰인다. 이름이 white면 흰색, black이면 검정, 그 밖에는 가운데 밝기의 회색이다. 색상 판에는 빈 상태 화면이 없고, 색이 하나도 없을 때도 "예외 색" 목록과 오른쪽 위의 "목록 추가"가 보인다. 단계 목록이 아직 하나도 없으면 "예외 색" 위에 본보기 목록을 흐리게 보여 준다. 이름 자리에 `{colors.ink-faint}`로 "primary"를 적고, 50부터 950까지 11칸을 `add-tile`과 같은 점선 빈 칸으로 놓고 아래에 단계 숫자를 적는다. 실제 값이 아니라 자리 표시이며, 누르면 "색 목록 추가" 창이 열린다. 목록을 하나라도 만들면 사라진다.
- **목록 끌어 옮기기**: 목록 이름을 잡고 위아래로 끌면 목록의 순서가 바뀐다. 끄는 동안 그 목록은 흐려지고, 놓일 자리에 2px `{colors.selection}` 가로 선이 그어진다. 마우스가 어떤 목록의 세로 한가운데보다 위에 있으면 그 목록 앞에, 모든 목록보다 아래에 있으면 맨 끝에 놓인다. 색이 없는 빈 목록은 옮길 수 없다. 이름을 5px 넘게 끌어야 옮기기로 치고, 그보다 덜 움직이면 누른 것으로 보아 목록을 선택한다.
- **목록 순서**: 한 목록의 색을 통째로 고른 채(목록 이름을 누르면 된다) Ctrl+] / Ctrl+[를 누르면 그 목록이 한 칸 아래 / 위로 옮겨진다. "예외 색" 목록도 색이 있으면 같은 방법으로 옮겨진다. 순서는 `tokens.css`에 색이 적힌 순서로 저장된다.
- **색 목록**: 색은 목록(예: primary, gray)에 속한다. "목록 추가" 버튼을 누르면 뜨는 "색 목록 추가" 창에서는 목록 이름과 함께 첫 색의 단계와 색을 정한다. 창 아래의 "50~950 단계 함께 만들기"가 켜져 있으면(기본) 그 색을 기준으로 11단계가 한 번에 만들어진다. 단계가 50~950 중 하나가 아니면 이 선택지는 꺼진다. 둘 다 빈 채로 시작하고, 비워 둔 칸에는 추천 값이 옅은 글자로 보인다. 색을 고르면 그 색의 밝기에 가장 가까운 단계(50~950)가 추천 단계로, 단계를 적으면 그 단계 밝기의 회색이 추천 색으로 뜬다. 아무것도 적지 않았으면 500과 그 밝기의 회색을 추천한다. 칸을 비운 채 만들면 추천 값이 쓰인다. 목록의 색을 모두 지워도 목록은 이름과 그 옆의 + 버튼만 남은 빈 채로 그대로 있고(이름은 `ff.canvas.json`에 기억한다), 빈 목록의 + 버튼을 누르면 색이 바로 생기지 않고, "색 목록 추가"와 같은 창이 목록 이름 칸 없이 떠서 첫 색의 단계와 색을 정한다(비워 두면 추천 값). 빈 목록은 이름을 누르면 이름에 `selection-outline` 선이 둘러지며 선택되고, 그 상태에서 Delete나 Backspace를 눌러야 없어진다. 삭제 버튼은 두지 않는다. 목록 이름을 누르면 그 목록의 색이 모두 선택되고(Shift로 다른 목록을 더한다), 색이 둘 이상인 한 목록을 통째로 선택하면 오른쪽 패널에 "목록 이름" 칸이 생긴다(색이 하나뿐인 목록은 그 색 하나를 고른 것과 같아 생기지 않는다). 이 칸을 고치면 그 목록의 색이 모두 새 이름을 따라가고, 그 색을 쓰던 컴포넌트도 따라간다. 목록 이름을 더블클릭하면 바로 그 칸으로 간다. 이미 있는 목록 이름으로는 바꿀 수 없다. 색 견본은 한 줄에 11칸으로 놓여, 50부터 950까지 11단계인 한 목록이 한 줄에 꽉 찬다. 색을 추가하는 것은 목록 이름 옆의 + 버튼이다. 색은 한 줄에 11개까지만 놓이고, 12번째 색부터는 다음 줄 맨 앞에서 시작한다. 목록 이름은 굵기 650이고, 영문 소문자라 작아 보이므로 예외로 16px을 쓴다. 한글인 "예외 색"과 다른 판의 종류 제목은 14px이다. 이를 위해 색상 판은 1380px 너비로 시작하고, 견본 하나는 너비 약 100px에 높이 64px이다. 화면 위의 "목록 추가"로 목록을 만들고, 각 목록의 이름 옆 + 버튼으로 그 목록에 색을 추가한다. 새 색의 이름은 50~950 중 지금 가장 큰 단계 다음의 빈 단계다(500, 600 다음이면 700. 뒤가 다 찼으면 앞쪽의 빈 단계, 빈 목록이면 500). 색 값은 그 단계에 맞게 계산한다. 목록에 있는 색(500이 있으면 500, 없으면 가장 가까운 단계)을 기준으로 "단계 생성"과 같은 방식으로 만들고, 기준으로 삼을 색이 없으면 그 단계 밝기의 회색을 쓴다. 새 색은 번호 순서에 맞는 자리에 들어간다. 11단계가 모두 차 있으면 전처럼 번호를 이어 가고 색은 `#888888`이다. 목록에 속하지 않은 색은 "예외 색"으로 모인다.
- **글자 크기와 줄 높이는 한 쌍이다.** 줄 높이는 따로 떨어진 목록이 아니라 글자 크기마다 하나씩 묶어 둔다. 파일에는 `--text-sm: 14px` 바로 뒤에 `--text-sm--line-height: 20px`로 적힌다(Tailwind의 규칙이라 `text-sm`만 써도 줄 높이가 따라온다). 줄 높이는 `1.5` 같은 배수가 아니라 px로만 정한다. 배수는 글자 크기에 따라 21px, 19.5px 같은 어중간한 높이를 만들고, px는 어떤 글꼴을 넣어도 줄의 높이가 같다.
  - **창 안에서도 되돌린다**: 글자 크기·굵기·의미 글꼴의 한 벌 만들기 창과 글꼴 종류 추가 창에서는 Ctrl+Z로 방금 바꾼 것을 되돌리고 Ctrl+Shift+Z(또는 Ctrl+Y)로 다시 실행한다. 판에서의 되돌리기는 저장된 값을 되돌리는데, 창이 열려 있는 동안에는 아직 저장된 것이 없어서 되돌릴 것이 없었다. 창 안에서 고르고 고친 것이 모두 들어간다: 설정(본문 크기, 단계 수, 단계 사이 등), 표에서 직접 고친 값과 이름, 쓸지 말지, 후보와 정한 글꼴, 견본을 보는 방식(크기, 굵기, 견본의 글꼴). "원래대로"로 한 번에 돌린 것도 한 단계로 되돌릴 수 있다. 0.5초 안에 이어진 변화는 한 번으로 묶는다(숫자를 한 글자씩 적거나 -, +를 연달아 누른 것). 칸에 적는 중에 눌러도 되고, 그때는 칸에서 손을 뗀다. 창의 상태가 아닌 글을 적는 칸(글꼴 종류 추가 창의 "찾기")에서는 브라우저의 되돌리기가 그대로 동작한다. 창을 닫으면 창 안의 기록은 사라지고, 만든 것은 판의 되돌리기로 되돌린다.
  - **한 벌 만들기는 그 종류를 통째로 새로 정한다**: 글자 크기, 굵기, 의미 글꼴의 한 벌 만들기 모두 같다. 만들면 그 종류의 예전 값을 모두 지우고 그 자리에 새 한 벌을 넣는다. 같은 이름의 값은 새 값으로 바뀌고, 새 한 벌에 없는 이름의 값은 지워진다(직접 추가해 둔 값도 마찬가지다). 예전 값을 남기면 4단계였던 것을 3단계로 다시 만들어도 넷째가 남아 한 벌이 되지 않는다. 글자 크기는 거기 묶인 줄 높이와 글자 사이도 함께 지운다. 무엇이 일어나는지는 만들기 전에 창 아래의 버튼 옆에 적는다(`이미 있는 2개는 새 값으로 바뀌어요. 한 벌에 없는 2개(medium, semibold)는 지워져요.`, 14px `{colors.ink-faint}`. 이름이 넷을 넘으면 앞의 넷과 "외 N개"). 지워지는 값 가운데 의미 글꼴이나 컴포넌트가 쓰고 있는 것이 있으면 이어서 `{colors.danger}`로 알린다(`쓰고 있는 값도 지워져요: semibold (title-lg, title-md)`). 막지는 않는다. 만든 뒤에는 그 값을 가리키던 자리가 "없는 값"으로 빨갛게 보이고, 되돌리기로 살릴 수 있다.
  - **값 칸을 비웠을 때**: 패널의 값 칸(크기, 간격, 모서리처럼 숫자에 단위가 붙는 값)을 비우면 지금 저장되어 있는 값이 옅게 보이고, 비운 채로 칸을 떠나면 그 값으로 돌아간다. Tab을 누르면 그 값이 채워지고 칸에 머문다. 줄 높이와 글자 사이는 글자 크기에서 계산한 추천값을 보여 주지만, 값 자체는 계산해 낼 규칙이 없어서 마지막으로 저장된 값을 보여 준다. 비운 것은 틀린 값이 아니라 고치는 중이므로 "숫자를 입력해 주세요"라고 알리지 않는다.
  - **한 벌 만들기**: 글자 크기는 낱개가 아니라 한 벌로 정해야 서로 어울리는지 알 수 있다. 글자 크기 묶음의 제목 오른쪽에 "한 벌 만들기" 버튼이 있고(빠른 실행에도 있다), 누르면 창(너비 1720px, 화면이 좁으면 그만큼 줄인다)이 열린다. 왼쪽 열(너비 224px)에는 위에서부터 본문 크기, 본문 줄 높이, 단계 수, 단계 사이, 글자 사이가 차례로 있고(만들어지는 값을 정하는 것들), 구분선 아래에 견본의 글꼴이 있다(보기만 바꾸는 것). 견본의 글꼴 목록에서 열보다 긴 글꼴 이름은 말줄임표로 잘린다. 표의 견본 글도 칸보다 길면 말줄임표로 잘린다. 왼쪽에서 본문 크기(-, + 버튼으로 13px에서 20px까지, 처음은 16px. 13보다 작으면 본문으로 읽기 힘들고 두 단계 아래인 xs가 쓸 수 없는 크기가 된다. 읽는 것이 중심인 서비스는 19~20px까지 쓴다), 단계 사이(-, + 버튼으로 아주 촘촘, 촘촘, 보통, 크게, 아주 크게의 다섯 칸, 처음은 보통. 본문보다 큰 단계가 한 단계마다 커지는 배수가 차례로 1.075, 1.125, 1.2, 1.25, 1.325다), 본문 줄 높이(-, + 버튼으로 2px씩, 처음은 규칙의 값. 본문 16px이면 22px에서 32px까지이고 처음은 24px)를 고르면, 오른쪽에 xs부터 3xl까지 일곱 단계가 큰 것부터 차례로 놓인다. 줄마다 이름, `크기 / 줄 높이`, 그 크기가 흔히 쓰이는 곳, 그 크기로 쓴 글이 있다. 쓰이는 곳은 3xl과 그보다 큰 단계(4xl, 5xl)는 큰 숫자·문구, 2xl 화면 제목, xl 구역 제목, lg 카드·창 제목과 소개 글, base 본문과 큰 버튼, sm 버튼과 이름표와 작은 본문, xs 보조 설명과 작은 버튼이다. 이것은 의미 글꼴 한 벌 만들기가 그 크기에 짝짓는 쓰임새와 같아야 한다(3xl은 display, 2xl은 title-lg, xl은 title-md, lg는 title-sm과 body-lg, base는 body와 button-lg, sm은 button과 label과 body-sm, xs는 caption과 button-sm). 두 창이 같은 크기를 다르게 부르면 안 되므로, 한쪽을 바꾸면 다른 쪽도 함께 바꾼다. 쓰이는 곳을 적는 칸의 폭은 144px이다. 글은 이 시스템의 글꼴로 그 자리에 실제로 놓일 법한 문장을 쓰는데, 의미 글꼴 창의 화면 예시(주문 관리)에 나오는 글들로 맞춰서 위에서 아래로 읽으면 한 화면의 위계가 된다(큰 단계는 굵기 700, base 이하는 굵기 400). 글의 뒤에는 `{colors.selection}` 35%의 바탕을 글의 폭만큼 깔아 줄 높이를 보여 준다. 옅은 바탕(`selection-soft`)은 흰 바탕과 구분이 잘 안 되어 줄 상자의 위아래 끝이 보이지 않는다. 바탕의 높이가 곧 줄 높이라서, 글자가 줄 안에서 위아래 가운데에 오는지를 눈으로 확인할 수 있다. 글자의 자리는 손대지 않고 글꼴이 정한 그대로 둔다(실제 화면에서도 그렇게 놓인다). 표의 줄에는 위아래 여백의 숫자를 적지 않는다. 글자가 가운데에 오는지가 중요한 것은 높이가 정해진 상자(버튼, 칩) 안이라, 화면 예시의 상자들 아래에만 적는다. 상자 아래의 숫자는 그 상자 안에서 글자가 가운데에서 밀린 양을 px로 적은 것이다(`위로 0.1`, 고정폭 12px. 밀린 양은 위 여백과 아래 여백의 차이의 절반이고, 0.05px보다 작으면 `가운데`라고 적는다. 위 여백과 아래 여백은 적지 않고 마우스를 올리면 나온다). 화면에 그려진 글자의 실제 자리를 재서 채우며, 상자에 적힌 글 그대로의 모양으로 잰다(버튼에서 눈에 보이는 것은 그 글이다). 브라우저는 기준선을 화면 픽셀에 맞추느라 글자를 가운데에서 1px 안쪽으로 밀어 놓는다(대개 위로). 화면 배율에 따라 달라지고 어느 사이트에서나 생기는 일이라 그 안쪽은 알리지 않고, 1px 넘게 밀렸을 때만 눈에 띄게 치우친 것으로 보고 `{colors.danger}` 색으로 적는다. 글꼴을 바꾸면 이 숫자가 달라지므로, 그 글꼴이 줄 높이 안에서 가운데에 앉는 글꼴인지를 숫자로 확인할 수 있다. 줄 사이는 4px 띄워 줄마다의 바탕이 구분되게 한다. 고르는 동안 바로 바뀌고, 창의 높이는 고르는 값이 아니라 화면에 맞춰 고정한다(화면 높이 - 48px). 높이를 바꾸는 것이 본문 크기, 단계 수, 단계 사이, 본문 줄 높이의 넷이고 서로 곱해져서, 어느 하나를 기준으로 잡으면 평소에 절반이 비거나 조금만 키워도 높이가 바뀐다. 그래서 창은 늘 같은 높이이고 아래의 버튼 줄도 늘 같은 자리에 있다. 가운데 열에서는 예시 상자가 아래에 붙고 표의 상자가 남는 높이를 모두 채운다. 표의 내용이 그 높이를 넘으면 표 안에서만 스크롤된다. 창 전체가 스크롤되지 않으므로 "취소"와 "만들기"는 늘 보인다. 화면 예시도 높이를 채우고, 넘치면 그 안에서 스크롤된다. 화면(브라우저 창)의 폭이 1700px보다 좁아 표, 예시 상자, 화면 예시가 위아래로 놓일 때는 그 셋을 담은 열이 통째로 스크롤된다. 왼쪽에는 "견본의 글꼴"도 있다. 견본과 예시를 어느 글꼴 종류로 그리고 있는지를 이름(`sans`)과 글꼴 이름으로 보여 주고, 글꼴 종류가 둘 이상이면 눌러서 바꾼다(처음에는 첫 번째 것). 글자 크기는 글꼴마다 따로 정하는 값이 아니라서 보기만 바뀐다. 글꼴마다 글자가 줄 안에 앉는 자리가 달라서, 바꾸면 위아래 여백의 숫자가 달라진다.
  - **화면 예시**: 표의 오른쪽(560px)에 이 한 벌이 한 화면에 놓인 모습을 함께 보여 준다. 표는 단계끼리 견주는 것이고, 이것은 글 한 편으로 이어 읽었을 때를 보는 것이다. 여기서 볼 것은 글자 크기뿐이라 의미 글꼴 창의 `type-screen`처럼 버튼과 카드가 있는 화면이 아니라, 글만 위계대로 놓는다. 화면은 단계 수마다 다르다(5단계는 설정 화면, 6단계는 주문 상세, 7단계는 공지 글, 8단계는 요약 화면, 9단계는 소개 페이지). 단계가 적은 한 벌과 많은 한 벌은 쓰이는 곳이 달라서, 같은 글에 줄만 더하고 빼지 않고 그 단계 수에 어울리는 화면을 보여 준다. 7단계의 공지 글은 이렇게 놓인다(날짜 xs, 화면 제목 2xl, 소개 글 lg, 숫자의 이름표 xs와 내세우는 숫자 3xl, 구역 제목 xl, 본문 문단 base, 카드 제목 lg, 본문 base, 덧붙이는 말 sm). 어느 화면이든 그 한 벌의 모든 단계가 한 번 이상 나오고, 단계의 자리는 표의 "쓰이는 곳"과 같다. 어느 글자가 어느 단계인지는 글자 앞에 적어 두지 않는다. 의미 글꼴 창처럼 표의 줄에 마우스를 올리면 화면 예시의 그 단계의 글자와 표 아래 예시 상자에 1px `{colors.selection}` 선이 생기고, 글자나 상자에 올리면 표의 그 줄이 표시된다. 표의 줄에서 `{colors.hover}` 바탕은 이름 칸, 값 칸, 쓰이는 곳까지만 덮는다(높이 32px, 모서리 6px). 바탕의 좌우 여백은 그 끝에 놓인 것의 위아래 여백과 같게 한다. 그래야 그것이 바탕의 모서리에서 사방으로 같은 거리에 놓인다. 이 표는 왼쪽 끝이 이름 칸(24px, 위아래 4px)이라 4px, 오른쪽 끝이 쓰이는 곳의 글자(줄 높이 16px, 위아래 8px)라 8px이다. 의미 글꼴 창의 목록은 왼쪽 끝이 체크 상자(16px, 위아래 8px)라 8px, 오른쪽 끝이 고르는 칸(24px, 위아래 4px)이라 4px이다. 줄 전체를 덮으면 견본 문장의 크기에 따라 줄마다 바탕의 높이가 달라지기 때문이다. 견본 문장은 바탕 밖에 두고 화면 예시의 글자처럼 1px `{colors.selection}` 선을 두른다. 그래서 의미 글꼴 창과 같이 "목록은 회색 바탕, 견본 글자는 파란 선"으로 표시된다. 한 줄을 다 차지하는 글자는 폭을 글자에 맞춰 선이 글자만 두른다. 굵기는 이 창에서 정하는 것이 아니라 제목은 700, 본문은 400으로 그린다. 본문 크기, 본문 줄 높이, 단계 수, 단계 사이, 글자 사이, 견본의 글꼴, 직접 고친 값이 모두 바로 반영된다. 화면(브라우저 창)의 폭이 1700px보다 좁으면 표와 예시 상자의 아래에 놓인다.
  - **원래대로**: 창 아래 버튼 줄의 왼쪽 끝에 "원래대로" 버튼(`button-ghost`, 되돌리기 아이콘)이 있다. 누르면 설정(본문 크기, 본문 줄 높이, 단계 수, 단계 사이, 글자 사이)과 표에서 직접 고친 값(크기, 줄 높이, 글자 사이, 이름)이 모두 처음으로 돌아간다. 견본의 글꼴은 만들어지는 값이 아니라 보기만 바꾸는 것이라 그대로 둔다. 바꾼 것이 없으면 꺼져 있다. "취소", "만들기"처럼 창 전체에 대한 일이라 같은 줄에 두되, 실수로 누르지 않게 반대쪽 끝에 둔다.
  - **왼쪽 열의 차례**: 본문 크기, 본문 줄 높이, 단계 수, 단계 사이, 글자 사이, 그리고 구분선 아래에 견본의 글꼴이다. 조절 넷은 두 묶음이다. 본문 크기와 본문 줄 높이는 기준이 되는 한 줄을 정하고, 단계 수와 단계 사이는 그 기준에서 한 벌을 어떻게 펼칠지를 정한다. 나머지 값이 모두 본문에서 계산되므로 본문이 먼저이고, 몇 단계인지가 얼마나 벌릴지보다 먼저다. 묶음 안의 설정 사이는 16px, 묶음과 묶음 사이는 24px이다.
  - **단계 수도 고른다**: 왼쪽 열의 "단계 수"를 -, + 버튼으로 5단계에서 9단계까지 조절한다. 처음은 7단계다. 본문 아래의 둘(xs, sm)과 본문은 늘 있고, 본문보다 큰 단계를 둘(xl까지)에서 여섯(5xl까지)으로 바꾸는 것이다. 5단계보다 줄이면 제목이 한 가지 크기뿐이라 위계를 만들 수 없다(보조 설명, 버튼, 본문, 카드 제목, 화면 제목이 최소다). 9단계보다 늘리면 쓰임새가 겹친다. 3xl부터는 모두 "큰 숫자·문구"이고 셋(3xl, 4xl, 5xl)이면 충분히 나뉜다. 제품 화면을 다루는 시스템은 대개 7~9단계다. 더 필요하면 만든 뒤 판의 "추가"로 잇는다. 단계의 크기에 따로 제한을 두지 않는다. 고를 수 있는 값의 끝(본문 20px, 9단계, 단계 사이 아주 크게)에서 가장 큰 단계가 108px이고 그것이 곧 한계다. 어떤 조합에서도 9단계까지 고를 수 있어야 한다. 일부 조합에서만 조용히 막히면 왜 안 되는지 알 수 없다. 화면 예시는 단계 수마다 다른 화면이다. 단계가 적은 한 벌과 많은 한 벌은 쓰이는 곳이 달라서, 같은 글에 줄만 더하고 빼지 않고 그 단계 수가 가장 어울리는 화면을 보여 준다. 5단계는 설정 화면(정보가 빽빽한 도구. 제목이 크지 않고 구역 제목과 본문이 되풀이된다), 6단계는 주문 상세(화면 제목, 구역 제목, 카드 제목의 세 층이 있는 흔한 앱 화면), 7단계는 공지 글(제목과 본문 사이에 내세우는 숫자가 하나), 8단계는 요약 화면(큰 숫자가 둘이고 크기로 무엇이 더 중요한지 나눈다), 9단계는 소개 페이지(맨 위에 가장 크게 내세우는 문구가 있고 그 아래로 숫자와 설명이 이어진다)다. 어느 화면이든 그 한 벌의 모든 단계가 한 번 이상 나오고, 글과 글 사이의 여백은 "견본 화면의 여백" 규칙을 따른다. 표의 "쓰이는 곳"도 5단계일 때는 xl이 "화면 제목, 구역 제목"이 된다. 단계를 줄여 만들면 예전의 큰 단계는 지워진다(한 벌 만들기는 그 종류를 통째로 새로 정한다).
  - **단계 사이와 줄 높이는 세 가지 가운데 고르지 않고 조절한다**: 세 가지(촘촘·보통·크게, 좁게·보통·넓게) 가운데 고르게 하면 그 사이의 값이나 더 큰 대비를 원할 때 단계마다 손으로 고쳐야 한다. 그래서 본문 크기처럼 -, + 버튼으로 조절한다. 단계 사이는 배수의 숫자가 아니라 이름을 보여 준다(`보통`). 1.2라는 숫자는 뜻을 아는 사람에게만 읽히고, 고르는 사람이 알고 싶은 것은 촘촘한지 큰지다. 숫자는 마우스를 올리면 나온다. 세 조절 칸(본문 크기, 단계 사이, 본문 줄 높이)은 값의 자리가 80px로 같아서 + 버튼이 세로로 줄지어 놓인다. 줄 높이는 배수가 아니라 본문의 줄 높이를 px로 보여 주고(`24px`) 2px씩 움직인다. 줄 높이는 언제나 짝수 px이라 배수로 조절하면 눌러도 변하지 않는 칸이 생기기 때문이다. 고른 본문 줄 높이를 규칙의 값으로 나눈 비율이 다른 단계에도 똑같이 곱해지고, 글자가 클수록 덜 띄우는 것은 그대로다. 본문 줄 높이의 아래는 규칙의 값보다 2px 낮은 값(더 좁히면 본문보다 작은 글자의 줄이 글자에 붙는다), 위는 8px 높은 값(더 벌리면 버튼과 칩의 높이가 어색해진다)이다. 단계 사이의 위를 1.325배에 둔 것은 그보다 크면 가장 큰 단계가 본문의 세 배를 넘어 제목으로 쓰기 어렵기 때문이다. 13px 이하의 작은 글자는 줄 높이의 비율이 0.1 커질 때마다 2px씩 더하고 규칙의 값보다 줄이지는 않는다. 패널에서 크기를 바꿀 때 줄 높이가 따라가는 것은 줄 높이가 좁게(0.9), 보통(1), 넓게(1.1) 가운데 하나의 값일 때뿐이고, 그 밖의 비율로 만든 줄 높이는 손으로 정한 것으로 보고 그대로 둔다.
  - **줄 높이와 글자 사이도 단계마다 고친다**: 표의 줄에서 크기 옆의 줄 높이(px)와 글자 사이(em)도 크기처럼 칸(`unit-input`의 작은 것)이다. 규칙이 낸 값이 미리 채워져 있고, 고치면 글자색이 진해지며(굵기는 바뀌지 않는다), 비우면 규칙의 값으로 돌아간다. 본문 줄의 크기도 다른 줄처럼 칸이다. 다만 직접 정한 값이라는 구분이 없고, 왼쪽의 "본문 크기"와 같은 값이라 여기서 고치면 한 벌 전체가 따라 바뀐다(13~20px. 범위 밖의 숫자가 적혀 있는 동안은 테두리가 `{colors.danger}`가 되고 반영되지 않는다). 본문 줄만 칸이 아니면 그 줄만 고칠 수 없어 보인다. 줄 높이는 4~200의 짝수만 받는다(줄 높이가 짝수여야 글자와 아이콘이 줄의 한가운데에 놓인다. 홀수가 적혀 있는 동안은 칸의 테두리가 `{colors.danger}`가 되고 그 값은 반영되지 않으며, 칸을 떠나면 앞의 값으로 돌아간다). 글자 사이는 -0.5~0.5를 받고, 글자 사이를 0으로 적으면 묶지 않는다. 직접 고친 값은 그 단계의 크기를 바꿔도 따라가지 않는다. 그 값을 정하는 규칙을 바꾸면 지워진다: 왼쪽의 "본문 줄 높이"를 바꾸면 고친 줄 높이가, "글자 사이"를 바꾸면 고친 글자 사이가, "본문 크기"나 "단계 사이"나 "단계 수"를 바꾸면 고친 것이 모두 지워진다. 단계 수는 남아 있는 단계의 규칙 값을 바꾸지 않지만, 어느 설정은 지우고 어느 설정은 남기면 무엇이 지워지는지 기억해야 하므로 한 벌의 틀을 바꾸는 설정은 똑같이 다룬다. 고친 이름은 어느 설정을 바꿔도 남는다. 값 칸의 폭은 240px이다. 세 칸은 폭이 고정이다(크기와 줄 높이는 세 자리 숫자가 들어가는 56px, 글자 사이는 가장 긴 값 -0.015가 들어가는 76px). 값의 길이에 따라 칸의 폭이 달라지면 위아래 줄이 맞지 않는다. 칸 안에서 숫자는 왼쪽에, 단위는 오른쪽 끝에 놓인다.
    - **본문 문단**: 따로 두지 않는다. 줄 높이의 차이는 줄과 줄 사이에서 보이는데, 화면 예시의 공지 글에 본문 크기로 쓴 세 줄짜리 문단이 있어서 거기서 본다.
    - **쓰이는 모습**: 표 아래의 상자에, 이 크기들이 실제로 들어가는 것들을 크기 × 종류의 표로 그린다. 열은 종류(버튼, 아이콘 버튼, 입력칸, 칩, 뱃지. 머리 줄에 이름을 적는다)이고 줄은 크기(xs, sm, base)다. 같은 종류를 위아래로 놓아야 크기에 따라 어떻게 달라지는지 한눈에 견준다. 맨 왼쪽 칸(84px)에 크기의 이름과 그 아래에 `12px / 16px`처럼 크기와 줄 높이를 고정폭 12px로 적는다. 그 종류가 쓰지 않는 크기의 칸은 비워 둔다: 버튼과 아이콘 버튼은 세 크기 모두, 입력칸은 sm과 base, 칩은 xs와 sm, 뱃지는 xs뿐이다. 아이콘은 16px(xs는 14px)이다. 높이가 정해진 상자 안에 글이 놓이는 것들이라 위아래 가운데가 조금만 어긋나도 눈에 띈다. 상자의 높이는 그 크기의 줄 높이에 위아래 여백을 더한 것이라(버튼·입력칸 8px, xs 버튼과 칩 4px, 뱃지 0) 줄 높이를 바꾸면 함께 바뀐다. 좌우 여백은 px로 고정하지 않고 상자 높이에 대한 비율로 정해서(버튼·아이콘 버튼·칩은 높이의 0.4배, 입력칸 0.34배, 뱃지 0.25배, 짝수 px로 맞춘다) 상자가 높아지면 좌우도 함께 넓어진다. 높이만 커지면 상자가 세로로 길쭉해져 모양이 무너진다. 줄마다 상자가 놓이는 자리의 높이는 그 줄에서 가장 커질 수 있는 상자에 맞춰 고정해서, 고르는 동안 표의 높이가 바뀌지 않는다. 상자 아래에는 글자가 상자의 가운데에서 어느 쪽으로 얼마나 밀렸는지만 적는다(`위로 0.1`, 밀린 양이 0.05px보다 작으면 `가운데`). 알고 싶은 것은 치우침이지 여백의 크기가 아니라서 위 여백과 아래 여백은 적지 않고, 마우스를 올리면 나온다. 아이콘 버튼에도 같은 한 줄만 적는다. 아이콘은 상자의 가운데에 놓이므로 글자와 아이콘의 높이 차이는 치우침과 늘 같은 값이라 따로 적지 않는다. 열 안의 것들(종류의 이름, 상자, 숫자)은 모두 열의 가운데에 맞춘다. 상자의 폭이 종류와 크기마다 달라서 왼쪽에 맞추면 열이 들쭉날쭉해 보인다. 맨 왼쪽의 크기 칸만 왼쪽 맞춤이다.
    - **값을 정하는 방식**: 본문보다 큰 단계(lg, xl, 2xl, 3xl)는 한 단계마다 정해진 배수만큼 커지고 가까운 정수 px에 맞춘다. 짝수로 몰지 않고 홀수도 쓴다. 고른 배수를 그대로 따르기 위해서이고, 13px, 15px 같은 홀수 크기는 흔히 쓰인다. 짝수여야 하는 것은 줄 높이다. 글자가 줄 안에서 밀리는 것은 대부분 브라우저가 화면 픽셀에 맞추면서 생기고 짝수 글자에서도 똑같이 생기므로, 크기를 짝수로 맞추는 선택지는 두지 않는다(밀린 정도는 예시 상자 아래의 숫자로 확인한다). 배수는 아주 촘촘 1.075, 촘촘 1.125, 보통 1.2, 크게 1.25, 아주 크게 1.325다. 반올림 때문에 앞 단계와 같아지면 1px 올린다. 본문보다 작은 단계는 본문의 7/8(sm)과 3/4(xs)이고 단계 사이와 관계없이 같다. 작은 글자는 더 작아지면 읽히지 않기 때문이다. 본문 16px에 보통이면 12, 14, 16, 19, 23, 28, 33px이 된다. 가장 작은 단계(xs)는 11px 아래로 내려가지 않는다. 10px의 한글은 획이 붙어 읽기 어렵고, 보조 설명과 작은 버튼처럼 읽어야 하는 글이 이 단계를 쓰기 때문이다. 그래서 본문 13px에서는 sm 12px, xs 11px이다(바닥이 없으면 11px, 10px). 본문이 14px 이상이면 바닥에 닿지 않는다. 작은 단계를 모두 한 칸씩 올리지는 않는다. 본문과 sm의 차이가 1px로 줄어 단계가 구분되지 않기 때문이다. 10px이 꼭 필요한 자리는 한 벌을 만든 뒤 칸에 직접 넣는다.
    - **단계마다 고치기**: 견본의 줄마다 크기 숫자가 작은 칸으로 되어 있어서 그 단계의 크기만 직접 정할 수 있다(8px에서 128px, ↑↓로 1씩, Shift는 10씩). 본문(base) 줄의 크기도 칸이다. 왼쪽의 본문 크기와 같은 값이라 13px에서 20px까지만 받고, 고치면 한 벌 전체가 따라 바뀐다. 칸은 작은 `unit-input`이고(높이 24px, 고정폭 12px), 고칠 수 있는 자리라는 것이 보이도록 테두리와 흰 바탕을 늘 둔다. 직접 정한 값은 글자색이 진해진다(굵기는 바뀌지 않는다). 칸을 비우면 규칙의 값으로 돌아간다. 줄 높이는 고친 크기에 맞춰 따라오고, 견본과 본문 문단, 쓰이는 모습도 바로 바뀐다. 칸을 누르면 숫자가 모두 선택되어 바로 새 값을 적을 수 있고, 숫자를 지우는 동안에도 칸의 폭은 줄지 않는다(줄면 옆의 줄 높이 글자가 따라 움직인다). 본문 크기나 단계 사이를 바꾸면 직접 정한 크기는 모두 지워진다(크기를 정하는 규칙이 바뀌었으므로 처음부터 다시 정한다). 줄 높이를 다시 골라도 직접 정한 크기는 남는다(줄 높이는 크기를 바꾸지 않는다). 칸이 들어가면서 줄의 높이는 적어도 32px이 된다.
    - **줄 높이를 정하는 방식**: 줄 높이는 언제나 짝수 px이다. 글자가 클수록 덜 띄운다(큰 글자를 본문과 같은 배수로 띄우면 줄 사이가 휑해 보인다). 기준은 보통이다. 보통은 16px 이하의 글자에 본문 배수(1.5), 32px 이상에 제목 배수(1.25)를 곱하고 그 사이의 크기는 두 배수 사이를 고르게 잇는다. 곱한 값은 가까운 짝수로 맞추되 딱 중간이면 작은 쪽으로 내린다(14px × 1.5 = 21 → 20). 좁게와 넓게는 따로 계산하지 않고 보통의 줄 높이에서 10%를 빼거나 더해 가까운 짝수로 맞춘다(딱 중간이면 보통에 가까운 쪽). 세 가지를 저마다의 배수로 계산하면 반올림이 제각각 걸려서 어떤 크기에서는 2px, 어떤 크기에서는 4px씩 들쭉날쭉 벌어지는데, 보통에서 끌어내면 어느 크기에서나 좁게 < 보통 < 넓게가 같은 폭으로 나란히 간다(22px 글자까지 2px씩, 그보다 크면 4px씩. 16px이면 22, 24, 26). 어느 것이든 글자보다 적어도 2px은 높게 한다. 13px 이하의 작은 글자는 배수를 쓰지 않고 글자 크기에 4px(넓게는 6px)을 더해 짝수로 올린다(좁게와 보통은 13px → 18px, 12px → 16px, 11px → 16px, 넓게는 2px씩 더). 배수로 정하면 12px 글자의 줄이 14px까지 줄어 글자 위아래가 1px씩밖에 남지 않는다. 경계를 13px에 둔 것은 작은 크기의 줄 높이가 고르게 올라가게 하려는 것이다(12 → 16, 13 → 18, 14 → 20, 15 → 22, 16 → 24). 배수로 정하면 13px이 20px이 되어 12px에서 4px이 한 번에 뛰고 13px과 14px이 같은 줄 높이가 된다. 본문을 가장 작은 13px로 고르면 본문의 줄 높이도 18px(1.38배)이라 조금 빽빽한데, 그 크기를 본문으로 쓰는 것은 정보가 빽빽한 도구라 그대로 두고, 넉넉하게 하려면 "넓게"(20px)를 고른다. 작은 글자는 여러 줄 본문보다 칩, 뱃지, 라벨에 쓰이는데 거기서는 12px 글자에 16px 줄이 가장 흔하고, 위아래 여백 4px을 더하면 높이가 24px로 떨어진다. 본문 16px이면 보통은 12/16, 14/20, 16/24, 19/28, 23/32, 28/36, 33/42, 좁게는 12/16, 14/18, 16/22, 19/26, 23/28, 28/32, 33/38, 넓게는 12/18, 14/22, 16/26, 19/30, 23/36, 28/40, 33/46이 된다.
    - **만들기**: 한 벌은 작은 것부터 차례로, 지금 글자 크기들이 있던 자리(없으면 글꼴 종류 뒤)에 들어간다. 예전의 글자 크기는 모두 지워지고 새 한 벌이 그 자리에 들어간다(위 "한 벌 만들기는 그 종류를 통째로 새로 정한다"). 무엇이 바뀌고 지워지는지는 버튼 왼쪽에 알린다. 이름이 그대로라 그 크기를 쓰던 컴포넌트는 새 값을 따라간다.
  - **글자 사이도 글자 크기에 묶는다**: 큰 글자는 글자 사이가 휑해 보여서 좁혀 쓰는 것이 보통이라, 줄 높이처럼 글자 크기마다 하나씩 묶어 둔다. 파일에는 `--text-xl--letter-spacing: -0.01em`으로 적힌다(Tailwind의 규칙이라 `text-xl`만 써도 글자 사이가 따라온다). 단위는 em이다(글자 크기에 비례한다). 규칙은 "큰 글자일수록 좁게"다. 16px 이하는 묶지 않고(글꼴이 정한 그대로), 32px에서 -0.02em이 되도록 고르게 좁히며 0.005em 단위로 맞춘다(19px -0.005em, 23px -0.01em, 28px -0.015em, 33px -0.02em). 작은 글자는 좁히면 뭉개져서 읽기 어려우므로 손대지 않는다. 묶인 글자 사이가 없는 크기는 그 값 자체가 파일에 없다. 한 벌 만들기 창에서는 "글자 사이"의 두 칸짜리 전환 버튼(그대로, 큰 글자 좁게. 처음은 큰 글자 좁게)으로 묶을지 고르고, 견본의 줄에 `33 px / 42px / -0.02em`처럼 셋째 값으로 적히며 견본 글자에도 바로 적용된다. 그대로를 고르고 만들면 같은 이름의 크기에 묶여 있던 글자 사이는 지워진다. `--tracking-` 값들은 묶이지 않고 따로 골라 쓰는 글자 사이다(영문 대문자 이름표를 넓히는 것처럼).
  - **판**: 글자 크기의 줄에 묶인 값을 `23px / 32px / -0.01em`로 함께 적고(글자 사이를 정하지 않은 크기는 `14px / 20px / 0em`. 0도 값이라 빼지 않는다. 빼면 그 자리가 비어 보이고 0인지 알 수 없다), 견본 문장을 그 줄 높이와 글자 사이로 두 줄 써서 줄 사이가 보이게 한다. 값 셋이 한 줄에 들어가도록 글자 크기의 이름 칸은 다른 줄(112px)보다 넓은 192px이다. 묶인 줄 높이가 없는 크기는 값 하나와 한 줄 견본이다.
  - **패널**: 글자 크기를 선택하면 크기 칸 아래에 "줄 높이" 칸이 있다. 두 칸 모두 `unit-input`이라 단위는 숫자 뒤에 붙어 고정되어 있고 숫자만 고친다. 줄 높이 칸이 비어 있으면 지금 글자 크기에 어울리는 추천값(한 벌 만들기의 "보통" 규칙)이 옅은 글자로 보이고, 비운 채로 칸을 떠나면 그 값으로 채워진다. 빈 칸으로 남겨 두지 않는다. 빈 칸에서 Tab을 누르면 추천값이 채워지고 그 칸에 머문다(다음 칸으로는 한 번 더 눌러야 넘어간다). 채우기와 넘어가기를 한 번에 하지 않는다. 글자 사이 칸도 같다.
  - **패널의 글자 사이**: 줄 높이 칸 아래에 "글자 사이" 칸(`unit-input`, 단위 em, 음수가 좁게)이 있다. 비어 있으면 줄 높이 칸처럼 추천값이 옅게 보이고, 비운 채로 칸을 떠나면 그 값으로 채워진다. 좁힐 필요가 없는 크기(16px 이하)는 추천값이 없어 0이 옅게 보이고 묶인 값 없이 둔다. 큰 글자에서 좁히지 않으려면 0을 적는다. 패널에서 크기를 바꾸면 묶인 글자 사이도 규칙대로의 값일 때만 새 크기를 따라가고(16px 이하로 내리면 지워진다), 손으로 정한 값은 그대로 둔다. 묶인 글자 사이가 없는 크기는 크기를 키워도 새로 생기지 않는다(그대로 두기로 고른 것일 수 있어서).
  - **크기를 바꾸면 줄 높이가 따라온다**: 패널에서 크기를 바꾸면 묶인 줄 높이도 새 크기에 맞는 값으로 함께 바뀐다(14px / 20px에서 크기를 18px로 올리면 26px). 지금 줄 높이가 예전 크기의 규칙대로일 때만 그렇고(보통, 좁게, 넓게 중 맞는 방식을 그대로 잇는다), 규칙과 다른 줄 높이는 손으로 정한 것으로 보고 건드리지 않는다. 줄 높이는 글자 크기에 맞아야 한다는 규칙이 크기를 고칠 때 조용히 깨지지 않게 하기 위해서다.
  - **추가**: 글자 크기 묶음 제목 줄의 "추가" 버튼을 누르면 다음 단계가 하나 생긴다. 정해진 표의 값이 아니라 지금 있는 크기들을 이어 간다. 이름은 다음 이름(xs, sm, base, lg, xl, 2xl, 3xl, 4xl, …)이고, 크기는 가장 큰 두 단계 사이의 배수만큼 더 큰 값이다. 그래서 한 벌 만들기로 만든 단계들 뒤에 눌러도 같은 간격으로 이어진다(16, 19, 23, 28, 33 다음은 39). 크기가 하나뿐이면 1.2배, 하나도 없으면 base 16px이다. 작은 쪽의 빠진 이름(xs, sm)이 생길 차례면 가장 작은 크기의 7/8이다. 줄 높이는 기준이 된 단계와 같은 방식(좁게, 보통, 넓게)으로 정한 짝수 px이고, 글자 사이는 이 시스템이 큰 글자를 좁히고 있을 때만 함께 생긴다.
  - **한 벌 만들기에서 이름 고치기**: 글자 크기와 굵기의 한 벌 만들기 창에서 단계의 이름은 줄 맨 앞의 칸에 미리 채워져 있고 고칠 수 있다(`body`, `title` 같은 다른 이름 체계를 쓰고 싶을 때). 값 칸처럼 테두리가 늘 보인다. 이름이 비었거나, 영문 소문자·숫자·하이픈이 아닌 글자가 들었거나, 같은 이름이 둘이면 버튼 왼쪽에 `{colors.danger}` 색으로 알리고 만들지 않는다. 고친 이름으로 만들면 예전 이름의 값은 "한 벌에 없는 이름"이라 지워진다(한 벌 만들기는 그 종류를 통째로 새로 정한다).
  - **컴포넌트**: 버튼 같은 컴포넌트의 줄 높이도 그 크기가 쓰는 글자 크기에 묶인 px 값이다. 묶인 값이 없어도 배수(1.2 같은)는 쓰지 않는다. 배수는 16.8px 같은 어중간한 높이를 만들어 글자와 아이콘이 가운데에 놓이지 못한다. 묶인 값이 없는 글자 크기는 크기를 추가할 때와 같은 규칙으로 계산한 px 값을 쓴다. 글자 크기를 고르지 않았거나 크기가 px, rem이 아니어서 계산할 수 없으면 줄 높이를 정하지 않는다(컴포넌트가 놓인 페이지의 줄 높이를 따른다). "CSS 복사"에는 크기 규칙마다 `line-height: var(--text-sm--line-height, 20px)`로 적힌다. 글자 사이도 그 글자 크기에 묶인 값을 따르고, 묶인 값이 없으면 글꼴이 정한 그대로다(`letter-spacing: var(--text-sm--letter-spacing, normal)`).
  - **이름 바꾸기, 복제, 삭제**: 글자 크기의 이름을 바꾸거나 복제하거나 지우면 묶인 줄 높이와 글자 사이도 함께 따라간다.
  - **따로 떨어진 줄 높이와 글자 사이 목록은 두지 않는다**: 줄 높이와 글자 사이(자간)는 글자 크기가 품고 있는 속성이다. 글자 크기를 보고 함께 정하는 값이라, 따로 떼어 놓으면 "이 크기에는 이 줄 높이와 자간"이라는 짝이 어디에도 남지 않고 엉뚱하게 조합할 길이 생긴다. 그래서 값을 정하는 길은 글자 크기 하나뿐이다. 파일에 예전의 `--leading-`이나 `--tracking-` 값이 남아 있으면 "줄 높이", "글자 사이" 묶음으로 보여 주고 고치거나 지울 수 있지만, 새로 추가하는 칸은 없다. 값이 없으면 묶음 자체가 보이지 않는다. 묶인 값을 벗어나야 하는 예외(대문자 이름표의 자간 등)는 값의 목록이 아니라 그 자리에서 정한다.
- **굵기도 한 벌로 정한다.** 굵기는 낱개가 아니라 "본문은 얼마, 버튼과 강조는 얼마, 제목은 얼마"라는 한 벌이다. 굵기 묶음의 제목 오른쪽에 "한 벌 만들기" 버튼이 있고(빠른 실행에도 있다), 누르면 글자 크기와 같은 틀의 창(너비 1160px)이 열린다.
  - **단계 수**: 왼쪽에서 -, + 버튼으로 2단계에서 4단계까지 고른다(처음은 3단계. 글자 크기 한 벌 만들기의 "단계 수"와 같은 모양이다). 2는 regular 400과 bold 700, 3은 regular 400, medium 500, semibold 600, 4는 거기에 bold 700까지다. 3단계에서 가장 굵은 것을 700이 아니라 600에 두는 것은, 700이 화면에서 무겁고 획이 많은 한글은 뭉쳐 보이기 쉬워서다. 이름은 Tailwind의 것이라 코드에서 `font-medium`, `font-bold`로 바로 쓰인다. 단계가 적을수록 한 단계가 맡는 쓰임이 많다. 2면 본문·입력칸·이름표(regular) / 제목·버튼·선택·강조(bold), 3이면 본문 / 버튼·선택·이름표 / 제목·강조, 4면 본문 / 선택·이름표 / 버튼·강조 / 제목이다.
  - **단계의 줄**: 오른쪽 위 상자에 얇은 것부터 한 줄에 한 단계가 놓인다. 줄마다 이름, 굵기 칸, 쓰이는 곳, 그 굵기로 쓴 글이 있다. 글은 모든 줄이 같은 문장(`비밀번호를 바꿨어요 Password 123`, 16px)이다. 굵기는 옆에 있는 것과의 차이가 전부라서 같은 글을 위아래로 붙여 놓아야 견줄 수 있다. 상자의 높이는 네 단계일 때에 맞춰 164px로 고정이다.
  - **굵기 칸**: 숫자를 직접 고칠 수 있다(100에서 900까지). 가변 글꼴은 550 같은 사이 값도 그대로 그린다. 직접 정한 값은 글자색이 진해지고(굵기는 바뀌지 않는다), 칸을 비우면 정해 둔 값으로 돌아간다. 단계 수를 바꾸면 직접 적은 굵기는 지워진다(글자 크기 한 벌 만들기와 같다. 한 벌의 틀을 바꾸면 처음부터 다시 정한다). 고친 이름은 남는다.
  - **짝 짚기**: 글자 크기 한 벌 만들기와 같다. 표의 줄에 마우스를 올리면 이름 칸, 굵기 칸, 쓰이는 곳까지 `{colors.hover}` 바탕(높이 32px, 좌우 여백은 왼쪽 4px, 오른쪽 8px)이 깔리고, 그 줄의 견본 문장과 화면 예시에서 그 단계의 굵기로 그린 글자와 상자에 1px `{colors.selection}` 선이 생긴다. 화면 예시의 글자나 상자에 올리면 표에서 그 굵기를 맡은 줄이 표시된다.
  - **원래대로**: 아래 버튼 줄의 왼쪽 끝에 "원래대로"가 있다. 단계 수와 직접 고친 값(굵기, 이름)을 처음으로 돌리고, 견본의 글꼴은 그대로 둔다. 바꾼 것이 없으면 꺼져 있다.
  - **실제로 그려지는 굵기**: 견본의 글꼴에 그 굵기가 없으면 줄의 오른쪽 끝에 `{colors.danger}` 색으로 "이 글꼴에서는 700으로 그려져요"라고 알린다. 없는 굵기는 가까운 것으로 뭉개져서 단계를 나눈 뜻이 없어지기 때문이다. 가변 글꼴인지는 그려 보고 가린다(450으로 쓴 글의 폭이 400과도 500과도 다르면 사이 값을 그릴 수 있는 글꼴이다). 굵기가 몇 개로 정해진 글꼴은 브라우저의 규칙대로 대신 그려지는 굵기를 적는다.
  - **쓰이는 모습**: 아래 상자에 짧은 화면 예시를 그린다. 주문 관리 화면(`type-screen`)을 다 펼치지 않고 `font-sample`과 같은 "주문 한 건" 화면을 쓴다. 큰 숫자와 여러 층의 제목까지 펼치면 자리마다 크기가 달라 굵기보다 크기가 먼저 보이고, 부품이 흩어져 보인다. 두 칸이고, 왼쪽은 읽는 것(머리말, 상품 이름, 금액과 수량, 강조 한 곳이 든 안내 문단, 주문 번호), 오른쪽은 고르고 누르는 것(탭 셋, 받는 분의 이름표와 입력칸, 버튼 둘)이다. 쓰임마다 그것을 맡은 단계의 굵기로 그리므로(상품 이름은 제목 굵기, 문단 속 강조와 금액은 강조 굵기, 버튼은 버튼 굵기, 이름표는 이름표 굵기, 고른 탭은 선택 굵기, 나머지는 본문 굵기), 단계 수나 숫자를 바꾸면 화면 전체가 따라 바뀐다. 크기는 이 창에서 정하는 것이 아니라 흔한 값(19, 16, 14, 13px)으로 둔다.
- **견본 화면의 여백**: 한 벌 만들기 창의 견본 화면(`type-screen`과 글자 크기 창의 화면 예시)에서 글과 글 사이에 줄 높이 말고 따로 띄우는 여백은 네 가지뿐이고, 두 화면이 같은 규칙을 쓴다. 이름표와 그것이 가리키는 글(분류 표시 → 숫자, 숫자의 이름표 → 숫자, 날짜 → 제목)은 0, 제목이나 글과 바로 이어지는 글(제목 → 소개 글 → 본문, 카드 제목 → 작은 본문, 본문 → 덧붙이는 말, 입력칸 → 설명)은 8px, 같은 묶음 안의 덩어리 사이(구역 제목 → 탭 → 카드, 본문 → 작은 제목, 카드의 글 → 버튼, 입력칸 → 버튼)는 16px, 묶음과 묶음 사이는 24px이다. 이름표와 입력칸 사이만 4px이다(입력칸은 테두리가 있는 상자라 0으로 붙이면 닿는다). 이 여백도 다른 그림처럼 의미 간격 클래스로 적는다(8px은 `blocks`, 16px은 `settings`, 24px은 `groups`, 4px은 `label`). 그림의 뿌리에 보여 주는 시스템의 간격 변수를 깔아 두므로 그 시스템이 그 이름의 값을 정해 두었으면 그 값으로 그려지고, 그 이름이 없는 시스템(간격을 아직 만들지 않은 시스템)에서는 FF의 값인 위의 숫자로 그려진다(위 "그림 안의 간격").
- **`type-screen`**: 글자의 쓰임새를 한 화면으로 보여 주는 예시(주문 관리 화면). 일정한 견본 문장을 늘어놓는 대신 실제로 쓰이는 자리에 놓아서 화면을 보며 판단하게 한다. 위에서부터 성과(분류 표시와 그 4px 아래의 큰 매출 숫자), 24px 아래에 화면의 머리(화면 제목과 소개 글, 그 오른쪽에 큰 버튼 하나, 아래에 본문과 강조 한 곳), 구역 하나(구역 제목 · 탭 아래에 카드 둘)이다. 왼쪽 카드는 주문 한 건(카드 제목과 금액, 작은 본문 두 줄, 주문 번호, 버튼), 오른쪽 카드는 그 주문의 배송지(카드 제목, 이름표와 입력칸과 설명, 버튼)다. 나란한 두 카드의 버튼은 크기가 같다(중간). 큰 버튼은 화면에 하나뿐인 주된 일이라 화면 제목의 오른쪽에 두고, 크기가 다른 버튼을 같은 줄에 나란히 놓지 않는다. 두 카드는 짜임이 같고(위에 카드 제목, 가운데에 내용, 아래에 버튼) 높이를 서로 맞추며 버튼은 아래 끝에 붙인다. 구역 제목 둘을 같은 높이에 나란히 놓고 그 아래에 서로 상관없는 것을 두지 않는다. 맨 아래에는 받은 분이 남긴 말(인용문)과, 누가 무엇을 두고 한 말인지(보조 설명)가 왼쪽 선 하나에 묶여 있다. 분류 표시는 숫자들의 머리다(무엇의, 언제의 숫자인지). 큰 숫자가 없는 한 벌에서는 화면 제목의 이름표가 되어 제목 바로 위에 붙는다. 인용문을 카드 안에 두지 않는다(카드 제목과 크기가 맞먹어 위계가 흐려진다). 큰 숫자의 자리는 그만큼 큰 크기가 있는 한 벌에서만 나온다. 의미 글꼴, 글자 크기, 굵기의 한 벌 만들기 창이 같은 화면을 쓰고, 자리마다 어떤 모습으로 그릴지만 창마다 다르다. 의미 글꼴 창에서는 자리를 눌러 쓸지 말지를 바꿀 수 있고(후보에 없는 탭 자리는 나오지 않는다), 나머지 두 창에서는 보기만 한다. 이 안은 사용자의 글꼴을 보여 주는 미리보기라 FF 도구의 글자 규칙을 따르지 않는다. 이 화면의 여백은 0(이름표와 그것이 가리키는 글), 8px(제목이나 글과 바로 이어지는 글), 16px(묶음 안의 덩어리 사이), 24px(묶음 사이, 카드의 안쪽)이고 이름표와 입력칸 사이만 4px이다. 놓인 것이 많아 위아래를 넉넉히 두되 허용된 값(4, 8, 12, 16, 24px)만 쓴다: 묶음 사이를 24px보다 벌리지 않고, 글과 글 사이(4px에서 8px)와 카드의 안쪽(16px에서 24px)을 넓혔다. 본문은 문장마다 줄을 바꿔 늘 세 줄이고(줄 높이를 보려면 두 줄로는 모자라다), 인용문은 두 줄이다. 의미 글꼴 한 벌 만들기 창을 처음 열면 자주 쓰는 여덟 개(title-lg, title-md, title-sm, body, body-strong, caption, label, button)와 내세우는 자리들이 켜져 있다. 나머지는 서비스에 따라 쓰는 것이라 화면을 보고 켠다.
  - **견본의 글꼴**: 글자 크기 창과 같다. 굵기는 글꼴마다 가진 것이 달라서, 글꼴을 바꾸면 "실제로 그려지는 굵기"가 달라진다.
  - **만들기**: 한 벌은 얇은 것부터 차례로, 지금 굵기들이 있던 자리(없으면 글자 크기 뒤)에 `--font-weight-이름`으로 들어간다. 예전의 굵기는 모두 지워지고 새 한 벌이 그 자리에 들어간다. 무엇이 바뀌고 지워지는지는 버튼 왼쪽에 알린다.
- **글꼴 종류의 줄**: 글꼴 종류는 값이 길어서(글꼴 이름 여러 개) 다른 줄처럼 왼쪽의 좁은 칸에 넣으면 잘린다. 그래서 이름과 값을 줄 전체 폭에 쓰고 넘치면 다음 줄로 넘기며, 견본 문장은 그 아래(8px 띄움)에 둔다. 값은 끝까지 보여야 한다. 값은 다른 줄의 값(14px)과 달리 12px(줄 높이 16px)로 작게 적는다. 길게 늘어선 글꼴 이름이 견본 문장보다 눈에 띄지 않게 하려는 것이다.
- **의미 색 판**: 색상 판이 쓸 수 있는 색을 모두 모아 둔 곳이라면, 의미 색 판은 그 가운데 실제로 쓰는 색에 쓰임새의 이름을 붙여 모아 둔 곳이다. 왼쪽 메뉴에서는 색상 바로 아래에 있고, 판의 기본 자리는 색상 판 바로 왼쪽, 기본 너비는 960px이다(나중에 생긴 판이라 이미 놓여 있는 다른 판을 밀지 않는 자리다). 색을 역할별로 글자, 바탕, 테두리, 채움, 상태, 차트 여섯 묶음으로 나누고 묶음마다 제목(14px 굵기 650)을 붙인다. 색이 없는 묶음은 보이지 않는다. 묶음 안에서는 파일에 적힌 순서대로 한 줄에 색 하나를 `role-row`로 보여 준다. 색을 추가하는 것은 판 위의 "추가" 버튼이다. 처음에는 비어 있다.
  - **순서**: 순서를 따로 저장하지 않고 파일에 적힌 순서가 곧 판의 순서다. 묶음의 순서는 파일에서 그 역할이 처음 나오는 순서, 묶음 안의 순서는 적힌 순서다. 묶음 제목을 잡고 위아래로 끌면 묶음이 통째로 옮겨지고, 색 한 줄을 잡고 끌면 같은 묶음 안에서 옮겨진다(다른 묶음으로는 옮겨지지 않는다. 묶음을 바꾸려면 패널에서 역할을 바꾼다). 5px 넘게 끌어야 옮기기로 치고, 끄는 동안 끄는 것은 40% 투명도로 흐려지며 놓일 자리에 `{colors.selection}` 2px 선이 보인다. 놓으면 파일에서 의미 색들이 묶음별로 모여 그 순서대로 다시 적힌다. 묶음 제목을 그냥 누르면 그 묶음의 색이 모두 선택된다.
  - **원래대로**: 접기 버튼 왼쪽의 "원래대로" 버튼을 누르면 묶음이 글자, 바탕, 테두리, 채움, 상태, 차트 순서로 돌아가고, 묶음 안의 색은 가리키는 색을 기준으로 놓인다. 무채색 목록(가장 선명한 색의 선명함이 0.04 미만인 목록)의 색과 검정·흰색을 먼저, 색깔 있는 것을 뒤에 둔다. 글자·테두리·버튼은 진한 것부터, 바탕은 밝은 것부터 놓는다. 색깔 있는 것은 색상 판의 목록 순서를 따르고 같은 목록 안에서는 같은 밝기 규칙을 쓴다. 가리키는 색이 없는 것은 맨 뒤다. 이미 그 순서면 버튼이 흐려져 눌리지 않는다. 색상 판에도 같은 버튼이 있어서, 목록을 회색 목록(가장 선명한 색의 선명함이 0.04 미만) 먼저, 색깔 있는 목록은 무지개 순서(빨강, 주황, 노랑, 초록, 파랑, 보라. 목록에서 가장 선명한 색의 색조로 가린다)로 놓고, 각 목록의 색을 번호 순서(50→950)로 돌려놓는다(번호가 아닌 이름은 뒤에 그대로). 예외 색은 맨 뒤에 두고 목록들과 같은 생각으로 놓는다: 무채색(선명함 0.04 미만)을 밝은 것부터 먼저, 색깔 있는 것을 무지개 순서로, 색으로 읽을 수 없는 값은 맨 뒤에 그대로. 둘 다 순서만 바꾸고, 판의 자리·너비·모양과 접은 상태는 건드리지 않는다. Ctrl+Z로 되돌릴 수 있다.
  - **접기**: 판 오른쪽 위의 접기 버튼을 누르면 모든 줄에서 가리키는 색, # 값, 설명, 예시가 사라지고 32px 색 견본과 이름만 남아 한 줄에 세 개씩 놓인다. 묶음 제목은 그대로다. 접은 채로도 선택하고 끌어 옮길 수 있고, 놓일 자리는 칸 왼쪽의 세로선으로 보인다. 접은 상태는 색상 판과 따로, 디자인 시스템마다 브라우저에 기억한다.
  - **파일 형식**: 의미 색은 같은 `tokens.css`의 `@theme` 안에 `--color-primary: var(--color-blue-600); /* 버튼: 가장 중요한 버튼 */`처럼 적는다. 값은 색상 판의 색 하나를 가리키고, 같은 줄 뒤의 주석이 역할과 설명이다. 주석은 "역할: 설명" 꼴이고 역할은 글자, 바탕, 테두리, 채움, 상태, 차트 중 하나다(예전 이름 "버튼"으로 적힌 주석은 채움으로 읽고, 다음에 역할이나 설명을 고칠 때 채움으로 적는다). 주석이 없거나 역할로 시작하지 않으면 주석 전체를 설명으로 보고 역할은 이름에서 짐작한다(`text`, `fg`가 들어 있으면 글자, `border`, `line`이면 테두리, `bg`, `surface`면 바탕, 그 밖에는 채움). AI가 파일에 직접 적어도 같은 규칙으로 읽는다.
- **의미 색의 여섯 묶음**: 앞의 넷(글자, 바탕, 테두리, 채움)은 색이 어디에 칠해지는지로 나눈 것이고, 뒤의 둘(상태, 차트)은 그것으로 나눌 수 없는 색이다. **채움**은 버튼만이 아니라 뱃지, 칩, 토글, 선택 표시처럼 색으로 채우는 것 모두다. 컴포넌트마다 묶음을 나누지 않는다. 같은 색이 버튼에도 켜진 토글에도 쓰여서, 나누면 같은 색을 가리키는 의미 색이 묶음마다 따로 생기고, 글자·바탕·테두리와 나누는 기준이 섞인다. 어느 컴포넌트가 어느 색을 쓰는지는 컴포넌트 화면에서 정한다. **상태**(성공, 경고, 위험, 정보)는 뜻이 먼저인 색이다. 위험 색 하나가 글자에도 바탕에도 테두리에도 버튼에도 쓰이므로 칠해지는 곳으로 흩지 않고 한 묶음에 모은다. 뜻이 상태면 어디에 칠하든 상태다(위험 버튼의 색도 상태). 그래서 채움에는 뜻이 없는 색(주요 버튼, 보조 버튼)만 남는다. **차트**는 그래프에서 계열끼리 구분하려고 쓰는 색이다. 그림자 색은 묶음으로 두지 않는다. 효과 판이 그림자 값 전체를 한 덩어리로 다룬다. 역할은 전환 버튼이 아니라 고르는 칸으로 정한다. 닫혀 있을 때는 고르는 칸의 모양(높이 32px, 오른쪽 끝에 화살표)이고, 누르면 여섯 묶음의 목록이 아래에 펼쳐진다. 줄마다 묶음의 이름을 진하게 정해진 폭(48px)에 적고, 그 묶음에 드는 것들을 그 옆에 옅게 적는다("채움" 옆에 "버튼, 뱃지, 칩, 토글, 선택"). 이름들이 한 열로 줄을 서서 이름만 훑어 고를 수 있다. 브라우저의 고르는 칸(select)은 쓰지 않는다. 그 목록에서는 글자를 한 가지 모양으로만 적을 수 있어서 이름과 드는 것들이 같은 모양으로 이어져 무엇이 이름인지 헷갈린다. 목록의 줄은 높이 32px이고 줄 사이는 4px이며, 고른 줄에는 바탕과 체크 표시가 있다. 칸에서 ↑↓로 목록을 펼치지 않고 묶음을 바꿀 수 있다. 역할을 적지 않은 색은 이름에서 짐작하되 상태를 가장 먼저 본다(danger, error, success, warning, info가 들어 있으면 상태. chart, series, data면 차트). `role-sample`은 묶음마다 다르다: 채움은 버튼·뱃지·칩·켜진 토글·체크 상자를 한 줄에, 상태는 옅은 바탕의 알림·채운 뱃지·테두리 상자와 그 아래 글자 한 줄을, 차트는 높이가 다른 막대 일곱 개를 그린다. 이미 만든 의미 색은 묶음이 저절로 바뀌지 않는다. 상태로 옮길지는 직접 고른다.
  - **단계 색과 가리기**: 이름이 똑같이 `--color-`로 시작하므로 값으로 가린다. 값이 `var(--color-…)` 하나면 의미 색이고 의미 색 판에, 아니면 색상 판에 나온다. 의미 색의 이름에는 하이픈을 쓸 수 있고 색 목록으로 묶이지 않는다.
  - **추가**: 판 위의 "추가" 버튼을 누르면 "의미 색 추가" 창이 열려 이름, 가리키는 색(`ref-picker`), 역할(고르는 칸), 설명을 정한다. 역할은 직접 고르기 전까지 이름에서 짐작한 것이 선택되어 있다. 직접 색 값을 적을 수는 없다. 색상 판에 없는 색은 먼저 색상 판(또는 예외 색)에 넣는다.
  - **패널**: 의미 색을 선택하면 오른쪽 패널에 이름, 가리키는 색(지금 색의 견본과 이름, # 값, 그 아래 `ref-picker`), 역할(고르는 칸. 역할을 바꾸면 판에서 그 묶음으로 옮겨 간다. 예시를 고치는 칸은 없다), 설명, 쓰이는 곳(쓰는 곳이 없어도 "없음"으로 늘 보인다), 코드(접힘)가 차례로 나온다. 가리키는 색과 역할은 누르는 즉시, 이름과 설명은 칸을 벗어나거나 Enter를 누르면 저장된다.
  - **컴포넌트에서 쓰기**: 컴포넌트의 색 칸(배경, 글자, 테두리)에서는 의미 색도 고를 수 있다. 고르는 목록 맨 위에 "의미 색" 묶음(이름 · 가리키는 색)이, 그 아래에 "색상" 묶음이 나온다. 의미 색이 없으면 묶음 없이 색만 나온다. 미리보기는 가리키는 색을 따라가 실제 색으로 그리고, 코드에는 `var(--color-primary)`처럼 의미 색의 변수가 그대로 들어간다.
  - **색상 판과의 연동**: 색이나 색 목록의 이름을 바꾸면 그것을 가리키던 의미 색도 새 이름을 따라간다. 색의 값을 고치면 의미 색 판의 견본과 예시도 함께 바뀐다. 의미 색이 가리키고 있는 색을 지우려 하면 컴포넌트가 쓰는 값을 지울 때처럼 먼저 묻는다(그 의미 색도 함께 지우는 경우는 묻지 않는다). 색을 선택했을 때 패널의 "쓰이는 곳"에는 그 색을 가리키는 의미 색도 나오고, 누르면 의미 색 판의 그 줄로 간다.
- **색 값의 형식**: 색은 파일(`tokens.css`)에 `oklch(밝기 선명함 색조)`로 저장한다. AI와 Tailwind v4가 쓰는 형식이라 변환 없이 주고받을 수 있다. 화면에서는 사람이 읽고 쓰기 쉬운 `#rrggbb`로 보여 주고 받는다. 색 견본 아래의 글자, 선택 이름표, 패널의 색 값 칸, 색 선택 창은 모두 `#`이고, 패널의 "코드" 구역에만 파일에 적힌 `oklch` 값("저장된 값")이 복사 버튼과 함께 보인다. `#`, `rgb()`, `hsl()`로 적거나 붙여넣은 색은 저장할 때 `oklch`로 바뀐다. 이미 `oklch`로 적힌 값은 고치지 않는 한 한 글자도 바꾸지 않는다. 예전에 `#`으로 저장된 색은 디자인 시스템을 열 때 한 번에 `oklch`로 바꿔 다시 쓴다. 같은 `#`을 넣으면 항상 같은 `#`이 보이도록 밝기·선명함은 소수점 다섯째 자리, 색조는 셋째 자리까지 적는다. 일반 화면(sRGB)이 낼 수 없는 선명한 색은 가장 가까운 `#`으로 보여 주고 값 앞에 `≈`를 붙인다. 이름으로 된 색이나 `var(…)`처럼 색으로 읽을 수 없는 값은 적힌 그대로 둔다. 판의 채우기·테두리 색은 디자인 시스템의 값이 아니라 FF 화면의 설정이라 `#` 그대로 저장한다.
- **투명한 색**: 색 값은 `#rrggbb` 말고도 투명도가 붙은 `#rrggbbaa` 여덟 자리를 쓸 수 있다(파일에는 `oklch(… / 0.5)`로 저장한다). 색 값의 색 선택 창에는 색조 막대 아래에 투명도 막대가, 색 값 칸 옆에 투명도(%) 칸이 있다(불투명이면 여섯 자리로 저장한다). 색 견본은 모두 회색·흰색 바둑판 무늬 위에 색을 올려 그려서, 반투명한 색이면 무늬가 비쳐 보인다. 판의 채우기·테두리 색과 목록 추가 창은 불투명한 색만 고른다.
- **단계 만들기**: 목록에 속하고 이름이 50~950 중 하나인 색(예: primary-500)을 선택하면 값 칸 아래에 "단계 생성" 버튼이 있다. 누르면 그 색을 기준으로 같은 목록의 빈 단계를 채워 50, 100, 200 … 900, 950의 11단계를 만든다. 이미 있는 단계는 건드리지 않고, 목록은 번호 순서로 다시 놓인다. 11단계가 이미 다 있으면 버튼이 "단계 다시 생성"으로 바뀐다. 누르면 고른 색만 그대로 두고 나머지 열 단계의 색을 모두 새로 계산한 색으로 바꾼다(기준 색을 바꾼 뒤 한 벌을 다시 뽑을 때 쓴다). 확인 창은 없고 되돌리기로 돌아간다. 색은 OKLCH 색 공간에서 기준 색의 색조를 지킨 채 밝기와 선명함만 단계별로 바꿔 만들며, 기준 색이 그 단계의 보통 밝기와 다르면 나머지 단계도 그만큼 당긴다. 색 값이 #rrggbb일 때만 쓸 수 있다. 색 값을 적는 칸(패널, 판의 채우기·테두리, 목록 추가 창)은 `#`을 빼고 여섯 자리만 적어도 받는다.
- **추가**: 값을 추가하는 버튼은 묶음의 제목 줄 오른쪽에 둔다(`button-ghost`, + 아이콘과 "추가"). 글자 크기와 굵기는 그 왼쪽에 "한 벌 만들기"가 함께 있고, 두 버튼 사이는 4px 띄운다. 종류가 하나뿐인 판(간격, 모서리, 테두리)에도 소제목이 있어서 버튼은 그 제목 줄 오른쪽에 놓인다. 판 안에 묶음 제목이 이미 있는 판(의미 글꼴, 의미 간격)은 소제목 없이 버튼만 오른쪽 위에 놓인다. 값이 하나도 없는 묶음은 제목 줄만 보이고 빈 상자를 그리지 않는다. 색은 목록마다 이름 옆의 작은 + 버튼(24px)으로 그 목록에 색을 추가하고, 의미 색은 판 위의 "원래대로", "접기" 옆에 "추가" 버튼이 있다.
- **추가하면 생기는 것**: 아무 이름(`new`)과 고정된 값이 생기지 않는다. 지금 있는 것 다음에 올 단계가 이름과 값을 갖추고 생긴다. 색에서 600 다음에 700이 그 단계에 맞는 색으로 생기는 것과 같은 원칙이다. 이름과 값은 Tailwind의 관례를 따른다. AI가 짜는 코드가 `text-lg`, `rounded-md` 같은 이름을 그대로 쓰기 때문이다.
  - **고르는 순서**: 종류마다 정해 둔 단계가 작은 것에서 큰 것 순서로 있다. 이미 있는 것 중 가장 뒤의 단계 다음 것이 생기고, 뒤가 다 찼으면 앞의 빈 단계가 생긴다. 하나도 없으면 종류마다 정해 둔 첫 단계에서 시작한다. 다른 이름 체계로 값을 만들어 둔 경우(`body: 16px` 등)에는 지금 가장 큰 값보다 큰 첫 단계에서 시작해 같은 값이 또 생기지 않게 한다. 정해 둔 단계를 다 썼을 때만 `new`, `new2`가 생긴다.
  - **단계** (굵은 것이 첫 단계):
    - 글자 크기: 표를 쓰지 않고 지금 있는 크기들을 이어 간다(위의 "추가"). 이름만 xs, sm, **base**, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl의 순서를 따른다.
    - 굵기: light 300, **regular 400**, medium 500, semibold 600, bold 700, extrabold 800
    - 글자 사이: tighter -0.04em, tight -0.02em, **normal 0em**, wide 0.02em, wider 0.04em
    - 간격: 이름이 숫자이고 값은 그 4배다. **1** 4px, 2 8px, 3 12px, 4 16px, 5, 6, 8, 10, 12, 16, 20, 24, 32
    - 모서리: xs 2, **sm 4**, md 8, lg 12, xl 16, 2xl 24, full 9999 (px)
    - 테두리 굵기: **thin 1px**, thick 2px, heavy 4px
    - 그림자: **sm**, md, lg, xl (점점 멀리, 점점 짙게). 옅은 그림자(검정 4~10%) 두 겹이다. 가까이 짧게 지는 것과 멀리 넓게 퍼지는 것을 겹쳐야 떠 있는 느낌이 자연스럽다. 진한 한 겹은 무겁고 예전 화면처럼 보인다.
    - 투명도: 값이 곧 이름이다. 10부터 90까지 10 단위, 첫 단계는 **50**(0.5)
    - 흐림: **sm 4px**, md 8px, lg 16px, xl 24px
    - 화면 폭 기준, 최대 너비: **sm 640**, md 768, lg 1024, xl 1280, 2xl 1536 (px)
    - 비율: **square 1 / 1**, photo 4 / 3, video 16 / 9, wide 21 / 9, portrait 3 / 4
    - 겹치는 순서: 값이 곧 이름이다. **10**, 20, 30, 40, 50
    - 움직임 시간: **fast 100ms**, normal 200ms, slow 300ms, slower 500ms
    - 움직임 흐름: **out**, in-out, in. 화면에 나타나고 반응하는 움직임은 거의 다 out(빠르게 출발해 부드럽게 멈춤)이라 out이 먼저 생기고, in은 사라질 때만 쓴다. 곡선은 끝에서 길게 감속하는 것(`cubic-bezier(0.16, 1, 0.3, 1)`)으로, 예전 Material의 `(0.4, 0, 0.2, 1)`보다 부드럽게 멈춘다.
  - **컴포넌트**: 종류를 추가하면 primary, secondary, ghost, danger의 순서로 이름이 붙는다(색은 비어 있다). 크기를 추가하면 sm, md, lg, xl의 순서로 이름이 붙고(하나도 없으면 md부터), 값은 마지막 크기의 좌우·위아래 여백과 글자 크기를 각각 한 단계 큰 값으로 바꾼 것이다. 더 큰 값이 기본 값에 없으면 그대로 둔다.
- **의미 글꼴**: 색상 판과 의미 색 판의 관계와 같다. 글꼴 판은 재료(글꼴 종류, 글자 크기, 굵기)를 모두 늘어놓은 판이고, "의미 글꼴" 판은 그 가운데 실제로 쓰는 조합에 쓰임새의 이름을 붙여 모은 판이다. 왼쪽 메뉴에서 "글꼴" 바로 아래에 있고, 판의 너비는 960px이다.
  - **조합**: 의미 글꼴 하나는 글꼴 종류, 글자 크기, 굵기 셋을 가리킨다. 줄 높이와 글자 사이는 글자 크기에 묶여 있어서 크기를 따라간다. 패널에서는 이 둘을 고르지도 적지도 않는다. "줄 높이", "글자 사이"는 칸이 아니라 글자로 적혀 있고 크기에 묶인 값을 보여 준다(아래 "의미 글꼴은 글꼴 판에 있는 값만 쓴다"). 오래 읽는 긴 글(줄 높이가 더 넓다)이나 제목 위의 작은 분류 표시(글자 사이가 넓다)처럼 같은 크기인데 줄 높이나 글자 사이만 달라야 하면 글꼴 판에 크기 단계를 하나 더 만들어 고른다. 예전에 조합에 직접 적어 둔 값(파일에서 손으로 고친 것 포함)은 그 값으로 그리되 진하게 적고, 옆에 지우는 버튼만 둔다. 지우면 다시 크기를 따른다. 파일에는 직접 적은 줄 높이가 `font` 값 안에 `36px`처럼, 글자 사이가 `--type-이름--letter-spacing`에 `0.08em`처럼 변수가 아닌 값으로 들어간다.
  - **파일**: `--type-이름`에 CSS의 `font` 한 줄 값으로 적는다(`var(굵기) var(크기)/var(크기의 줄 높이) var(글꼴)`). 쓰는 쪽은 `type-title-lg` 클래스 하나면 된다(CSS로 직접 적을 때는 `font: var(--type-title-lg)` 한 줄). `font` 한 줄에는 글자 사이가 들어가지 않으므로, 크기에 묶인 글자 사이가 있으면 바로 뒤에 `--type-이름--letter-spacing`이 그것을 가리킨다. 설명은 값 뒤의 주석이다. 줄 높이 자리와 글자 사이 값은 사람이 고치는 것이 아니라 저장할 때마다 지금의 글자 크기에 맞춰 다시 적는다(크기의 줄 높이나 글자 사이를 지우면 함께 빠진다).
  - **묶음**: 의미 색을 역할로 묶듯, 의미 글꼴은 그 글자가 화면에서 맡는 일로 묶는다. 묶음은 다섯이다: **제목**(화면, 구역, 카드의 제목), **본문**(본문, 강조, 인용), **보조**(설명, 분류 표시), **조작**(버튼, 이름표, 메뉴, 탭), **숫자·코드**(금액, 통계, 고정폭 글자). 묶음은 판의 차례를 정한다. 설명 앞에 `제목: 화면의 제목`처럼 적어 저장한다(의미 색과 같은 방식). 묶음 이름 뒤에는 쌍점이 반드시 온다. `본문`처럼 묶음 이름과 같은 설명을 묶음으로 잘못 읽지 않게 하려는 것이다. 묶음을 적지 않은 조합은 이름에서 짐작한다(`title-lg`는 제목, `button`은 조작, `caption`은 보조, `code`는 숫자·코드, 어디에도 들지 않으면 본문). 그래서 한 벌 만들기로 만든 조합이나 다른 곳에서 가져온 파일도 묶음을 적지 않은 채로 제자리에 놓인다.
  - **판**: 묶음별로 제목을 두고 그 아래에 조합을 한 줄에 하나씩 놓는다. 묶음 사이는 24px, 묶음 제목과 목록 사이는 8px이다. 줄의 왼쪽 칸(224px)에 이름(`{typography.label}`), 가리키는 세 값의 짧은 이름(`sans · 2xl · semibold`, 고정폭 12px), 설명이 있고 오른쪽에 그 조합이 쓰인 모습(예시)이 있다. 가리키는 값이 없어졌으면 그 이름을 `{colors.danger}`로 적는다. 선택하면 이름표에 실제 숫자(28px / 36px / -0.015em · 600)가 붙는다.
  - **예시는 쓰인 모습이다**: 모든 줄에 같은 견본 문장을 늘어놓지 않는다. 그러면 크기와 굵기는 보이지만 그 조합이 제 자리에서 어떻게 보이는지는 보이지 않는다. 의미 색 판이 색을 그 역할로 쓰인 모습으로 보여 주듯, 그 글자가 놓이는 자리에 놓아 보여 준다. 예시는 줄마다 두 가지로 정해진다.
    - **모양**: 어떤 자리에 놓을지. 열한 가지다: 제목(아래에 본문이 따르는 제목), 문단(줄이 바뀌는 글), 설명(이름 아래의 작은 글), 버튼(채운 버튼과 테두리 버튼), 이름표(입력칸 위의 이름표), 메뉴(메뉴 목록의 항목들), 고른 메뉴(목록에서 고른 한 줄), 탭(탭 줄), 뱃지, 숫자(이름표 아래의 금액과 통계), 코드(옅은 바탕의 고정폭 글자). 모양은 묶음이 아니라 줄마다 정한다. 한 묶음에도 쓰임이 여럿이라(조작 묶음에 버튼, 메뉴, 뱃지가 함께 있다) 묶음으로 정하면 메뉴 글자가 버튼으로 그려져 설명과 맞지 않는다. 고르지 않은 줄은 이름에서 짐작하고(`menu`는 메뉴, `menu-strong`은 고른 메뉴, `button`은 버튼), 짐작할 수 없으면 묶음의 첫 모양이다(제목, 문단, 설명, 버튼, 숫자).
    - **문구**: 그 안에 적을 말. 이 시스템이 실제로 쓰는 말을 줄마다 적는다(FF라면 메뉴에 "색상, 의미 색, 글꼴", 버튼에 "추가, 취소"). 지어낸 말로 채우면 예시가 실제 화면과 이어지지 않는다. 늘어놓는 모양(버튼, 메뉴, 탭, 뱃지, 숫자)은 쉼표와 빈칸으로 나눠 적으면 하나씩 그려진다. 비워 두면 모양의 기본 문구로 그린다.
    - **읽을 수 있는 글자는 그 조합으로 적은 것뿐이다.** 곁에 놓이는 것(제목 아래의 본문, 설명 위의 이름, 입력칸에 적힌 값, 숫자 위의 이름표, 고르지 않은 메뉴 줄)은 글자가 아니라 높이 8px의 옅은 회색 막대(글자 색을 바탕에 16% 섞은 색, 모서리 4px)로 그려 자리만 알려 준다. 곁의 것까지 글자로 적으면 어느 글자가 그 조합인지 헷갈린다. 바탕과 글자 색은 이 시스템의 기본 바탕과 글자 색이다(의미 색 예시와 같은 것). 예시 안의 여백은 좌우 16px, 위아래 12px이고, 큰 글자도 자르지 않고 줄을 바꿔 다 보여 준다.
    - **예시는 여럿일 수 있다**: 한 조합이 여러 자리에 쓰이면(패널의 제목이자 구역의 제목, 버튼이자 입력칸의 이름표) 자리마다 예시를 하나씩 둔다. 판에서는 위아래로 8px 띄워 쌓는다.
    - **예시는 패널에서 고치지 않는다(의미 색도 같다)**: 그 값이 화면 어디에 어떤 말로 쓰였는지를 아는 쪽은 페이지를 만든 AI다. 사람이 패널에서 모양을 고르고 문구를 치는 것은 AI가 이미 아는 것을 손으로 옮겨 적는 일이고, 패널만 길어진다. 그래서 예시는 AI가 값을 정리할 때 파일의 주석에 함께 적고, FF는 그것을 읽어 그리기만 한다. 적혀 있지 않은 줄은 이름에서 짐작한 모양과 기본 문구로 그린다. 패널에서 묶음이나 설명을 고쳐도 같은 주석에 적힌 예시는 그대로 남는다.
    - **AI에게 알리는 자리**: 형식은 화면이 아니라 `tokens.css` 맨 위의 안내 주석(`/* ff:guide … ff:guide 끝 */`)에 적는다. AI가 값을 고치려고 파일을 열면 반드시 보게 되는 자리다. 의미 색과 의미 글꼴의 주석 형식, 역할·묶음·모양의 이름, 예 한 줄씩, 그리고 "문구는 지어내지 않고 화면에 있는 말을 옮긴다"는 규칙이 들어 있다. FF가 저장할 때마다 다시 쓰고(새 시스템을 만들 때도 넣는다), 사람이 고친 것은 덮어쓴다. 화면에는 안내 문구를 넣지 않는다.
    - **저장**: 모양과 문구도 설명과 함께 주석에 적는다. `조작(버튼): 버튼, 입력칸의 이름표 | 추가, 취소 | 이름표: 글꼴 종류`. 괄호 안이 첫 예시의 모양(직접 고른 줄에만 적힌다), 첫 ` | ` 뒤가 첫 예시의 문구, 그 뒤로 ` | 모양: 문구`가 예시마다 이어진다.
  - **차례**: 순서를 따로 저장하지 않고 파일에 적힌 순서가 곧 판의 순서다. 묶음은 파일에서 처음 나오는 순서로 놓인다. 묶음 제목을 끌면 묶음이 통째로, 줄을 끌면 같은 묶음 안에서 옮겨지고, 놓일 자리에 `{colors.selection}` 선이 보인다. Ctrl+[ 와 Ctrl+] 로도 같은 묶음 안에서 옮긴다. 묶음 제목을 누르면 그 묶음의 조합이 모두 선택된다. 판 오른쪽 위의 "원래대로"는 기본 순서로 돌려놓는다: 묶음은 제목, 본문, 보조, 조작, 숫자·코드 순서, 묶음 안에서는 큰 글자부터, 같은 크기면 굵은 것부터. 크기나 굵기를 숫자로 읽을 수 없는 조합은 맨 뒤다. 이미 기본 순서면 버튼이 꺼져 있다.
  - **클래스**: 의미 색은 `--color-ink`라고 정하면 Tailwind가 `text-ink`를 저절로 만들어 주지만, `--type-`은 Tailwind가 모르는 이름이라 저절로 생기는 클래스가 없다. 클래스가 없으면 코드에서 크기와 굵기를 매번 따로 적게 되어, 정해 둔 조합이 쓰이지 않는다(FF 자신의 코드가 그랬다. 의미 글꼴을 정해 두고도 240여 곳에서 크기와 굵기를 따로 적었다). 그래서 FF는 저장할 때마다 `tokens.css`의 `@theme` 아래에 의미 글꼴마다 `@utility type-이름 { font: var(--type-이름); }`을 함께 적는다. 글자 사이 값(`--type-이름--letter-spacing`)이 있으면 `letter-spacing` 줄도 넣는다. 이 구역은 `/* ff:type … */`와 `/* ff:type 끝 */` 주석 사이에 있고, 저장할 때마다 값에서 다시 만든다. 사람이 고친 것은 덮어쓰고, 구역 밖에 적힌 것은 건드리지 않는다. 의미 글꼴을 지우거나 이름을 바꾸면 클래스도 따라 바뀌고, 의미 글꼴이 하나도 없으면 구역 자체가 없다.
  - **패널**: 이름, 조합("글꼴 종류" · "글자 크기" · "굵기"를 고르는 칸 셋), 묶음(다섯 가운데 하나를 고르는 칸. 의미 색 패널의 "역할"과 같은 자리이고 같은 컨트롤이다. 이름을 진하게 정해진 폭에, 드는 것들을 그 옆에 옅게 적는다. 이름 칸은 가장 긴 "숫자·코드"가 들어가는 64px이다), 설명, 쓰이는 곳, 코드. 예시를 고치는 칸은 없다(예시는 AI가 파일에 적는다). 실제로 그려지는 숫자를 따로 적지 않는다. 조합 구역의 고르는 칸들에 크기, 줄 높이, 글자 사이, 굵기의 값이 이미 나와 있다. 고르는 칸에는 "없음"이 없다. 셋을 모두 가리켜야 조합이기 때문이다. 코드 구역의 "쓰는 법"에는 클래스(`type-heading`)가 먼저, CSS 한 줄(`font: var(--type-heading)`)이 그 아래에 있고 줄마다 복사 버튼이 있다.
  - **한 벌 만들기**: 창(너비 1440px)에서 후보 조합을 보고 쓸 것만 골라 만든다. 왼쪽(676px)은 후보 목록이고 오른쪽은 그 조합들로 짠 화면 하나다(높이는 목록에 맞춘다). 일정한 견본 문장을 늘어놓지 않고 실제로 쓰이는 자리(큰 숫자, 화면 제목, 본문, 카드, 버튼, 입력칸의 이름표와 설명, 주문 번호)에 놓아 보여 줘서, 이 조합을 쓸지 말지를 화면을 보며 판단하게 한다. 목록의 줄마다 쓸지 정하는 체크 상자, 이름 칸, 설명, 그리고 글꼴 종류 · 글자 크기 · 굵기를 고르는 칸 셋이 있다. 줄은 이름 칸과 고르는 칸이 아닌 어디를 눌러도 쓸지 말지가 바뀐다. 쓰지 않는 조합은 줄과 화면 속 자리가 모두 흐려진다(화면에서는 25%). 버튼이나 입력칸, 주문 번호의 바탕처럼 글자가 상자 안에 있는 자리는 상자까지가 한 덩어리라 상자째로 흐려지고, 마우스를 올렸을 때의 선도 상자를 두른다. 제목처럼 한 줄을 차지하는 글자는 선이 줄 끝까지 가지 않고 글자만 두른다. 지우지 않고 흐리게 남기는 것은 빼면 어디가 비는지 보이게 하려는 것이다. 화면 속 글자를 눌러도 쓸지 말지가 바뀌고, 줄이나 글자에 마우스를 올리면 서로 짝이 되는 쪽이 표시된다(줄은 `{colors.hover}`, 글자는 1px `{colors.selection}` 선). 후보는 많으면 열아홉 개다. 내세우는 자리 셋은 그만큼 큰 크기가 있을 때만 나온다(display는 본문에서 4단계 위라 7단계 한 벌부터, display-lg는 5단계 위라 8단계부터, display-xl은 6단계 위라 9단계에서. 모두 700). 자주 쓰는 여덟 개와 나온 내세우는 자리들이 처음부터 표시되어 있다. 나머지는 모든 서비스가 쓰는 것은 아니어서 고르게 둔다: body-lg(1단계 위, 400), body-sm(1단계 아래, 400), quote(1단계 위, 500), overline(2단계 아래, 600), button-lg(본문 크기)와 button-sm(2단계 아래), numeric(1단계 위, 600), code(고정폭 글꼴, 1단계 아래). 후보는 모두 줄 높이와 글자 사이가 크기를 따른다. 줄 높이만 넓힌 긴 글용 본문은 두지 않는다(한 시스템 안에 줄 높이 규칙이 둘 섞인다). overline도 글자 사이를 넓히지 않는다(영어 대문자에는 맞지만 한글은 흩어져 보인다). 목록은 같은 식구끼리 묶어 이름표를 붙이고(제목: display-xl, display-lg, display, title-lg, title-md, title-sm / 본문: body-lg, body, body-strong, body-sm, quote / 보조: caption, overline, label / 버튼: button-lg, button, button-sm / 숫자·코드: numeric, code), 묶음 안에서는 큰 것부터 놓는다. 화면 예시에 나오는 순서를 따르면 식구가 흩어지기 때문이고, 화면과의 짝은 마우스를 올리면 이어지는 표시가 맡는다. 이름표의 모양은 글꼴 종류 추가 창의 목록과 같다. 창의 높이는 화면에 맞춰 고정이고, 목록이 길면 목록만 스크롤되며 아래 버튼 줄은 늘 보인다. 만든 뒤 판에는 내세우기, 제목, 본문, 그 밖의 순서로 놓인다. 목록의 줄은 높이 32px이고, 이름 칸(112px)과 설명은 잘리지 않는다(설명에 말줄임표를 쓰지 않도록 짧게 적는다). 아래에 몇 개를 만드는지 적는다. 고른 것이 없거나 이름이 비었거나 겹치면 만들 수 없고 까닭을 알린다. 제목 셋(title-lg, title-md, title-sm: 본문 크기에서 3, 2, 1단계 위, 600에 가까운 굵기), 본문(body: 본문 크기, 400), 본문 강조(body-strong: 600. 본문 속에서 앞뒤의 400 글자와 나란히 놓이므로 500으로는 묻힌다), 보조 설명(caption: 2단계 아래, 400), 이름표(label)와 버튼(button: 1단계 아래, 500). 제목은 display나 heading이라는 글꼴 종류가 있으면 그것을, 나머지는 sans나 body(없으면 고정폭이 아닌 첫 글꼴)를 쓴다. 정해진 px가 아니라 있는 값 가운데에서 고르므로 어떤 한 벌을 만들어 두었든 그 안에서 짝이 지어진다. 예전의 의미 글꼴은 모두 지워지고 고른 조합들이 그 자리에 들어간다. 글꼴 종류, 글자 크기, 굵기 가운데 없는 것이 있으면 무엇부터 만들어야 하는지 알린다.
- **의미 글꼴 한 벌이 판의 단계 수를 따르는 방식**: 후보는 정해진 값이 아니라 지금 판에 있는 크기와 굵기에서 짝을 고른다. 본문 크기는 base, body, md, medium, default, normal, text, m 가운데 있는 이름의 크기이고(없으면 16px에 가장 가까운 것), 본문을 18px이나 20px로 잡은 한 벌에서도 그대로다. 제목 셋은 위에서부터 채운다: 본문보다 큰 단계가 셋 넘게 있으면 3, 2, 1단계 위이고, 둘뿐이면(5단계 한 벌) 화면 제목 2단계 위, 구역 제목 1단계 위, 카드 제목은 본문 크기에 굵기만 올린다. 그래서 제목끼리 크기가 겹치지 않는다. 내세우는 자리는 큰 단계가 있는 만큼 나온다: display는 7단계부터(3xl), display-lg는 8단계부터(4xl), display-xl은 9단계에서(5xl). 나온 것은 처음부터 켜져 있다. 그만큼 큰 크기를 만들어 두었다는 것은 쓰겠다는 뜻이기 때문이다. 그래서 처음 켜져 있는 것들(자주 쓰는 여덟 개와 내세우는 자리들)만으로 판에 있는 크기가 5단계든 9단계든 하나도 빠짐없이 쓰인다. 견본 화면의 큰 숫자도 하나에서 셋까지, 있는 만큼 나온다. 굵기는 바라는 값에 가장 가까운 것을 고르되, 버튼은 바라는 굵기(500)가 없으면 더 굵은 쪽을 고른다(굵기가 둘뿐인 한 벌에서 버튼은 bold, 이름표와 본문은 regular. 굵기 한 벌 만들기 창이 적어 둔 쓰임새와 같다).
- **이름과 값의 검사(색, 의미 색, 의미 글꼴)**: 새 색 목록, 예외 색, 목록 이름 바꾸기는 그 이름이 목록 이름, 모든 색의 이름(의미 색 포함), 의미 색 이름의 앞머리(`text-muted`의 `text`)와 겹치면 만들 수 없다. 의미 색과 단계 색은 이름이 똑같이 `--color-`로 시작해서, 겹치면 같은 이름의 값이 둘이 되어 저장이 거절되기 때문이다. 색 목록의 이름을 바꾸거나 복제할 때는 그 목록의 단계 색만 따라간다. 같은 말로 시작하는 의미 색(`primary-hover`)은 목록에 속하지 않는다. 의미 색을 하나 지워도 색상 판에 빈 목록이 생기지 않는다. 색 값 칸은 쓰다 만 # 값(`#12345`)을 저장하지 않고 알린다. `#fff` 같은 세 자리·네 자리 값은 여섯·여덟 자리로 늘려 읽는다. `var(--color-…)`를 적어 색을 의미 색으로 바꾸는 것은 막는다(의미 색은 의미 색 판에서 만든다). 이름으로 된 색처럼 FF가 읽지 못할 뿐인 값은 그대로 둔다. 복사한 글자에는 주석(의미 색의 역할과 설명)이 함께 담기고, 붙여넣으면 따라온다. 의미 색을 Ctrl+]나 Ctrl+[로 옮기면 같은 역할 묶음 안에서만 움직인다. 끌었다가 제자리에 놓으면 저장하지 않는다. 의미 글꼴 패널에서 줄 높이와 글자 사이는 고르지 않는다(아래 항목). 한 벌 만들기 창의 크기 칸과 굵기 칸도 받을 수 없는 값이면 빨갛게 한다. 의미 글꼴이 가리키는 글꼴 종류, 크기, 굵기 가운데 하나라도 없어지면 FF는 그 조합을 남은 값으로 그리지 않고 통째로 깨진 것으로(FF의 기본 글자 모습으로) 그린다. 코드에서 `font: var(--type-이름)` 한 줄이 통째로 무효가 되는 것과 같은 모습이다. 의미 글꼴 한 벌의 본문 크기는 `base`, `body`, `md`, `medium`, `default`, `normal`, `text`, `m` 가운데 있는 이름으로 찾고, 없으면 16px에 가장 가까운 크기다. 빈 의미 글꼴 판에서 "추가"를 누르면 제목과 본문이 먼저 생기고 내세우는 자리(display…)는 맨 나중이다. 이름이 겹쳐 만들 수 없을 때는 무엇과 겹치는지를 적는다("같은 이름의 목록이 이미 있어요.", "같은 이름의 의미 색(ink)이 이미 있어요.", "이 이름으로 시작하는 의미 색(on-primary)이 있어서 쓸 수 없어요."). 겹치는 것이 지금 화면에 보이지 않을 수 있기 때문이다. 이름 뒤에는 조사를 붙이지 않는다(영문 이름은 받침을 알 수 없다). 오른쪽 패널의 값 칸(색과 글로 적는 값)은 적는 동안 저장하지 않고, 칸을 벗어나거나 Enter를 누를 때 저장한다. 적는 동안의 값은 패널의 견본에만 보인다. #1a2b3c를 적는 동안 #1a2, #1a2b가 잠깐씩 저장되어 그 색을 쓰는 화면이 깜빡이고 되돌리기 단계가 잘게 쌓이는 것을 막는다. Esc는 적던 것을 버리고, 받을 수 없는 값을 둔 채 칸을 벗어나면 저장된 값으로 돌아간다. 색 고르기, ↑↓, 화면에서 색 찍기는 바로 저장한다. 단위가 붙은 숫자 칸(크기, 줄 높이 등)은 전처럼 적는 대로 저장한다. 의미 글꼴 판의 맨 위에는 가리키는 값이 없어진 조합의 수가 빨갛게 적힌다("가리키는 값이 없어진 조합 2개"). 누르면 그 가운데 첫 조합이 골라져 오른쪽 패널에서 바로 고칠 수 있다. 없어진 조합이 없으면 나오지 않는다.
- **의미 글꼴은 글꼴 판에 있는 값만 쓴다**: 의미 색이 색상 판의 색만 가리키듯, 의미 글꼴도 글꼴 종류, 글자 크기, 굵기를 글꼴 판에 있는 것 가운데에서 고르기만 한다. 줄 높이와 글자 사이는 고르지도 적지도 않는다. 고른 글자 크기에 묶인 값을 그대로 따르고, 패널에는 그 값이 칸이 아니라 글자로 적혀 있다. 조합마다 값을 따로 적게 하면 글꼴 판만 봐서는 실제로 쓰이는 줄 높이를 다 알 수 없게 된다. 다른 줄 높이가 필요하면 글꼴 판에 크기 단계를 하나 더 만들어 고른다. 예전에 직접 적어 둔 값이 있는 조합(파일에서 손으로 고친 것 포함)은 그 값으로 그리되 진하게 적고 옆에 지우는 버튼만 둔다. 지우면 크기의 값을 따른다. 말없이 사라지게 하지 않는다. 패널에서의 차례는 글꼴 종류, 글자 크기, 줄 높이, 글자 사이, 굵기다. 줄 높이와 글자 사이는 크기에 딸린 값이라 크기 바로 아래에 두고, 글꼴 판이 크기, 줄 높이, 글자 사이의 차례로 보여 주는 것과 맞춘다.
- **글꼴 판과 의미 글꼴 판에는 말줄임표가 없다**: 줄의 이름, 값(크기 / 줄 높이 / 글자 사이), 가리키는 값, 설명, 견본 문장은 칸보다 길어도 자르지 않고 줄을 바꿔 끝까지 보여 준다. 줄의 높이가 그만큼 늘어난다. 견본 문장도 같다. 큰 글자는 여러 줄이 되지만, 끝이 "…"로 사라지면 그 크기에서 글이 어떻게 놓이는지를 볼 수 없다. 이름처럼 띄어쓰기 없이 긴 낱말은 칸의 끝에서 끊어 다음 줄로 넘긴다.
- **효과 판**: 그림자, 투명도, 흐림 세 종류를 한 판에 둔다. 효과에는 의미 판을 따로 두지 않는다. 그림자는 개수가 적고 한 값이 한 쓰임에만 쓰여서(떠 있는 것, 창), 재료(단계)와 쓰임을 두 층으로 나누면 고칠 곳과 이름만 둘이 된다. 그래서 값의 이름을 단계(sm, md)가 아니라 쓰임(`float`, `dialog`, `disabled`)으로 짓고, 의미 색·의미 글꼴처럼 설명과 예시를 값 뒤의 주석에 적는다.
  - **판**: 의미 판과 같은 줄 목록이다. 한 줄에 값 하나, 왼쪽 칸(224px)에 이름(`{typography.label}`), 값(고정폭 12px), 설명이 있고 오른쪽에 그 값이 쓰인 모습이 있다. 그림자 값은 길어서 줄을 바꿔 다 보여 준다(작은 타일에 넣고 "…"로 자르지 않는다). 줄은 뜻의 단위로 바꾼다. 그림자는 겹마다 한 줄씩 적어 한 겹의 숫자들이 두 줄로 갈라지지 않게 하고, 설명은 문장마다 새 줄에서 시작하며 쉼표로 늘어놓은 것은 한 덩어리씩 붙여 둔다("확대 / 도구"처럼 낱말 사이에서 끊기지 않는다. 18자가 넘는 덩어리만 낱말 사이에서 바뀐다). 설명의 줄바꿈은 의미 글꼴 판도 같다. 투명도는 `0.4`가 아니라 `40%`로 적는다. 선택 이름표에는 그림자 값을 적지 않는다.
  - **예시**: 줄마다 모양과 문구가 있고 여럿일 수 있다(의미 판과 같은 방식. 패널에서 고치지 않고 AI가 주석에 적는다). 그림자의 모양은 메뉴(떠 있는 목록), 창, 알림, 카드. 투명도는 꺼짐(같은 버튼을 켜진 것과 꺼진 것으로 나란히), 가림막(화면을 덮는 막과 그 위의 창), 겹침. 흐림은 유리(그대로인 것과 흐려진 것을 나란히). 고르지 않은 줄은 이름에서 짐작한다(`float`는 메뉴, `dialog`는 창, `disabled`는 꺼짐). 그림자 예시는 그림자가 잘리지 않게 상자 둘레에 24px을 비우고, 떠 있는 면의 가장자리에 옅은 1px 선을 함께 둔다. 주석은 `그림자(메뉴): 드롭다운 목록, 알림 | 이름 바꾸기, 복제, 삭제 | 알림: 저장했어요`처럼 종류의 이름으로 시작한다.
  - **패널**: 이름, 값, 설명, 쓰이는 곳, 코드. 그림자는 겹마다 가로, 세로, 흐림, 퍼짐(px)과 진하기(%) 다섯 칸으로 고친다(두 칸씩 나란히, 칸 사이 8px, 겹 사이 16px). 값을 글자로 통째로 적게 하면 어느 숫자가 무엇인지 외워야 하고 쉼표 하나에 값이 깨진다. 맨 아래의 "+ 겹 추가"는 마지막 겹보다 멀리 넓게 지는 겹을 더하고, 겹이 둘 이상이면 겹 제목 오른쪽의 × 로 지운다. 칸이 모두 숫자일 때만 저장하고, 아닌 칸에는 `{colors.danger}` 테두리를 둔다. 색을 `rgb(… / 진하기)`가 아닌 꼴로 적은 겹은 진하기 칸 대신 색을 그대로 보여 주고, 겹으로 읽을 수 없는 값(`none`, `var()`)은 글자로 고친다. 투명도는 퍼센트 칸, 흐림은 px 칸이다. 코드 구역에는 클래스(`shadow-float`, `opacity-disabled`)와 변수(`var(--shadow-float)`)가 있다.
- **판 안의 차례**: 차례를 누가 정하는지는 종류마다 다르고, 기준은 하나다. **값에 크기의 차례가 있으면 저절로 놓고 손으로 바꿀 수 없게, 쓰임으로 이름 붙인 것이면 손으로 바꿀 수 있게 한다.**
  - **저절로 놓이는 종류**: 글자 크기, 굵기, 간격, 모서리, 테두리, 화면 폭 기준, 최대 너비, 겹치는 순서, 움직임 시간, 그리고 색 목록 안의 단계(50~950). 차례가 값에서 정해진다(`xs < sm < base`, `4 < 8 < 12`). 사람이 정할 것이 없으므로 값의 크기순(작은 것부터, 색 단계는 숫자순)으로 놓는다. 손으로 바꿀 수 있게 하면 얻는 것은 없고 `base`가 `xs` 위에 놓이는 어긋난 상태만 가능해진다. 끌 수 없고 Ctrl+[ ]도 듣지 않으며 "원래대로"도 없다. 파일을 열 때와 저장할 때마다 제자리에 놓으므로, 값을 고쳐 크기가 달라지면 줄이 제 차례로 옮겨 간다. 글자 크기에 딸린 줄 높이와 글자 사이는 제 크기를 따라 함께 옮겨진다. 숫자 하나로 읽을 수 없는 값(`clamp()`, `var()`)은 맨 뒤에 둔다.
  - **손으로 바꾸는 종류**: 색 목록(gray, red…), 예외 색, 의미 색, 의미 글꼴, 효과(그림자, 투명도, 흐림), 글꼴 종류, 비율, 움직임 흐름. 어느 것이 먼저인지는 값에서 나오지 않고 "무엇이 더 중요한가, 무엇끼리 가까운가"라는 사람의 판단이다. 줄(칸)을 끌어서 옮기고 Ctrl+[ ]로도 옮긴다. 끌기와 단축키는 언제나 함께다. 끌 수 있는 것은 단축키로도 옮겨지고, 끌 수 없는 것은 단축키로도 옮겨지지 않는다. 끄는 것은 40%로 옅어지고 놓일 자리에 `{colors.selection}` 선이 보인다(줄 목록은 가로선, 칸 목록은 세로선). 헝클어졌을 때 돌아갈 "원래대로"가 판마다 하나 있고(종류가 여럿인 판은 판의 오른쪽 위, 종류가 하나뿐인 판은 그 종류의 제목 줄 오른쪽), 이미 기본 순서면 꺼져 있다. 기본 순서: 그림자는 멀리 지는 정도가 작은 것부터, 투명도와 흐림은 값이 작은 것부터, 비율은 세로로 긴 것부터, 글꼴 종류는 본문 글꼴·세리프·고정폭, 흐름은 linear·in·out·in-out(색 목록, 의미 색, 의미 글꼴의 기본 순서는 저마다의 항목에 있다).
  - **효과가 손으로 바꾸는 쪽인 이유**: 효과의 이름을 단계가 아니라 쓰임(`float`, `dialog`)으로 짓기로 했기 때문이다. 단계 이름(`sm`~`xl`)으로 지은 시스템에서는 "원래대로"가 크기순으로 놓아 준다.
- **가리키는 값이 없어졌을 때의 표시**: 의미 색, 의미 글꼴, 의미 간격은 다른 값을 가리킨다. 가리키던 값이 없어지면 세 판 모두 같은 방식으로 알린다. 판에서는 없어진 값의 이름을 `{colors.danger}`로 적고 뒤에 " · 없어짐"을 붙인다(`blue-600 · 없어짐`, `sans · 2xl · semibold · 없어짐`, `9 · 없어짐`). 패널과 컴포넌트 패널의 고르는 칸은 "고른 값이 없어졌어요. 다시 골라 주세요."라고 적는다.
- **판에는 말줄임표를 쓰지 않는다(모든 판)**: 이름과 값, 설명은 칸보다 길면 줄을 바꿔 다 보여 준다. 색상 판의 색 칸과 네모 칸(모서리, 비율)처럼 좁은 칸에서는 이름이 두 줄이 될 수 있다. 값(색 값처럼 띄어쓰기가 없는 글자)은 글자 사이에서 줄을 바꾼다. 의미 색 판의 설명도 다른 판처럼 뜻의 단위로 줄을 바꾼다. 판은 고를 수 있는 값을 빠짐없이 보여 주는 곳이라, 끝이 "…"로 사라지면 무엇인지 알 수 없다. 창 안의 목록(글꼴 목록 등)과 패널은 이 규칙의 대상이 아니다.
- **의미 판의 "추가"와 예시**: 의미 판(의미 색, 의미 글꼴, 의미 간격)과 효과 판의 "추가"는 모두 창을 띄워 이름과 가리키는 값을 정하게 한다. 의미 색은 이름·가리키는 색·역할·설명, 의미 글꼴은 이름·글꼴 종류·글자 크기·굵기·묶음(기본 한 벌 가운데 아직 없는 다음 것의 이름과 조합이 미리 채워져 있어 그대로 누르면 전처럼 다음 조합이 생긴다), 의미 간격은 이름·가리키는 간격·묶음, 효과는 쓰임·이름이다. 창은 예시를 묻지 않는다. 예시의 모양과 문구는 그 값을 쓰는 화면을 만든 AI가 주석에 적는다.
  - **예시가 그려지는 조건**: 이름에서 쓰임을 짐작할 수 있는 판(의미 색, 의미 글꼴, 효과)은 주석에 적힌 것이 없어도 이름에서 짐작한 모양으로 예시를 그린다. 주석에 모양과 문구가 적혀 있으면 그것이 짐작을 덮는다. 이름만으로는 무엇과 무엇 사이인지 알 수 없는 의미 간격은 주석에 모양을 적은 값에만 예시를 그린다.
  - **추가 버튼의 모양**: 판 위나 제목 줄의 "추가", "목록 추가"는 모두 바탕 없는 버튼이다. "원래대로", "접기"와 나란히 4px 띄워 놓는다.
- **이름의 규칙과 오류 문구**: 값의 이름은 만들 때와 패널에서 고칠 때 같은 규칙으로 검사한다. 문구는 셋이다. 비었으면 "이름을 입력해 주세요.", 쓸 수 없는 글자가 있으면 "영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요."(색 목록 안의 단계와 예외 색은 하이픈을 쓸 수 없어 "영문 소문자와 숫자만 쓸 수 있어요."), 이름이 겹치면 "같은 이름이 이미 있어요."(색은 무엇과 겹치는지를 덧붙인다). 의미 간격은 숫자로 시작하는 이름을 쓸 수 없다(토대 간격의 이름이다). 색은 패널에서 이름이나 목록을 고칠 때도 만들 때와 같은 규칙으로 막는다. 목록 없는 색(예외 색)의 이름이 목록 이름, 다른 색의 이름, 의미 색 이름의 앞머리(`on-primary`의 `on`)와 겹치면 안 되고, 지금 없는 새 목록 이름도 그런 이름과 겹치면 안 된다. 이미 있는 목록의 이름을 적어 그 목록으로 옮기는 것은 된다.
- **패널의 "코드" 구역**: 어느 패널이나 같은 모양이다. **쓰는 법**(코드에 적을 클래스와 변수. 줄마다 복사 버튼), **저장된 값**(복사 버튼), **저장 위치**. 쓰는 법에 적는 클래스는 종류마다 다르다. 의미 색은 `text-이름`·`bg-이름`·`border-이름`, 색은 `text-`·`bg-`, 의미 글꼴은 `type-이름`과 `font: var(--type-이름);`, 간격과 의미 간격은 여백과 사이(`p-이름`·`gap-이름`, 의미 간격은 `gap-이름`·`px-이름`), 글자 크기는 `text-이름`, 굵기와 글꼴 종류는 `font-이름`, 모서리는 `rounded-이름`, 그림자·투명도·흐림은 `shadow-이름`·`opacity-이름`·`blur-이름`. 마지막 줄은 언제나 `var(--변수)`다.
- **접기**: 줄마다 설명과 예시가 있는 판(의미 색, 의미 글꼴, 의미 간격, 효과)과 색상 판에는 "접기"가 있다. 접으면 설명과 예시(색상 판은 이름과 값 글자)를 숨기고 이름과 값만 남긴다. 보는 방식일 뿐이라 파일이 아니라 브라우저에 판마다 기억한다. 자리는 "원래대로" 옆이다.
- **복사와 붙여넣기**: 값을 복사하면 그 값에 딸린 것(글자 크기의 줄 높이와 글자 사이, 의미 글꼴에 직접 정한 글자 사이)도 함께 담긴다. 붙여넣으면 딸린 것은 제 값 바로 뒤에 놓이고, 이름이 겹쳐 값의 이름이 달라지면 딸린 것도 새 이름을 따른다. 복제(Ctrl+D)와 같다. 다른 값을 가리키는 값(의미 색, 의미 간격)을 붙이면 같은 의미 값들의 맨 뒤에 놓인다.
- **이름표 안에 버튼을 넣지 않는다**: 칸의 이름표는 `label`이라, 그 안의 글자나 빈 곳을 누르면 안에 든 첫 버튼이 눌린다. 버튼이나 고르는 칸(펼치는 목록)이 든 칸은 `label`이 아닌 상자로 그린다(`Field`의 `plain`). 그러지 않으면 "줄 높이" 글자를 눌렀을 때 지우기가 눌리고, 펼친 목록의 바깥을 눌러 닫으면 다시 열린다.
- **묶음의 차례와 묶음 제목**: 판 안에서 값들을 나눠 놓은 것(색 목록, 의미 색·의미 글꼴·의미 간격의 묶음, 글꼴 판의 글꼴 종류·글자 크기·굵기, 효과 판의 그림자·투명도·흐림 같은 종류)을 통틀어 묶음이라 한다. 묶음의 제목은 어느 판에서나 똑같이 움직인다.
  - **누르면 그 묶음의 값이 모두 선택된다.** 그래서 제목에는 언제나 호버 바탕(`{colors.hover}`)이 있다. 호버 바탕은 "누를 수 있다"만 뜻한다.
  - **끌면 판 안에서 묶음의 차례가 바뀐다.** 끄는 묶음은 40%로 옅어지고 놓일 자리에 `{colors.selection}` 가로선이 보인다. 옮길 수 있는 제목은 마우스 모양이 잡는 손(grab)이다. 옮길 수 있는지는 호버 바탕이 아니라 마우스 모양으로 알린다.
  - **끌어서 옮겨지는 것은 단축키로도 옮겨진다(값이든 묶음이든).** 묶음을 통째로(그리고 그것만) 고른 채 Ctrl+] / Ctrl+[를 누르면 그 묶음이 한 칸 뒤 / 앞으로 옮겨진다. 제목을 누르면 묶음이 통째로 골라지므로, 제목을 누르고 단축키를 누르면 된다. 값을 골랐으면 그 값이 같은 묶음 안에서 옮겨진다(의미 색, 의미 글꼴, 의미 간격은 파일에서 이웃한 다른 묶음의 값과 자리를 바꾸지 않는다). 값이 하나뿐인 묶음에서 그 값을 고르고 누르면 묶음이 옮겨진다. 끌 수 없는 것(값의 크기로 차례가 정해지는 값, 값이 없는 묶음)은 단축키로도 옮겨지지 않는다.
  - **끄는 법은 한 곳에 있다**(`useReorder`). 값의 줄과 칸, 색 목록, 의미 판의 묶음, 판 안의 종류가 모두 같은 코드로 끌린다. 그래서 어느 판에서나 똑같다: 5px 넘게 끌어야 옮기기로 치고(그냥 누르면 선택), 놓일 자리는 줄 목록은 세로 한가운데, 여러 칸 목록은 읽는 순서(왼쪽에서 오른쪽, 위에서 아래)로 찾고, 선은 이웃한 둘 사이의 한가운데에 긋는다(줄 사이 4px, 격자의 칸 사이 12px, 묶음 사이 24px의 절반만큼 바깥). 의미 색·의미 글꼴·의미 간격의 줄은 같은 묶음 안에서만 옮겨진다.
  - **옮길 수 없는 묶음은 값이 하나도 없는 묶음뿐이다.** 파일에 자리가 없어서 차례를 적어 둘 곳이 없다. 값이 없는 종류는 값이 있는 종류들 뒤에 정해진 차례로 오고, 비어 있는 "예외 색" 목록은 색상 판의 맨 아래에 온다. 이런 제목은 마우스 모양이 보통의 버튼과 같다. "예외 색"도 색이 있으면 다른 색 목록처럼 끌어 옮긴다.
  - **차례는 파일에 남는다.** 묶음의 차례는 `tokens.css`에 그 묶음의 값이 처음 나오는 차례다. 묶음을 옮기면 그 값들이 파일에서 통째로 옮겨진다(글자 크기에 딸린 줄 높이처럼 값에 딸린 것도 함께).
  - **"원래대로"는 판마다 하나다.** 그 판에서 손으로 바꿀 수 있는 차례(묶음의 차례와 묶음 안의 값의 차례)를 한 번에 정해진 대로 돌려놓는다. 묶음마다 따로 두면 판에 같은 버튼이 여럿 늘어서고, 어느 것이 무엇을 돌려놓는지 가려 읽어야 한다. 이미 정해진 차례면 꺼져 있다. 자리는 판의 오른쪽 위다(종류가 하나뿐인 판은 그 종류의 제목 줄 오른쪽). 손으로 바꿀 차례가 없는 판(간격, 모서리, 테두리)에는 없다. 색상 판의 "원래대로"는 예외 색 목록을 맨 아래로 돌려놓는다.
  - **묶음 안의 값의 차례는 따로다.** 위의 "판 안의 차례"대로, 값에 크기의 차례가 있는 종류는 묶음을 옮겨도 그 안의 값은 크기순 그대로다.
  - **종류가 하나뿐인 판에도 소제목을 둔다**(간격 판의 "간격", 모서리 판의 "모서리"). 다른 판은 묶음마다 제목이 있는데 이런 판만 제목 없이 목록이 시작되면 혼자 비어 보인다. 옮길 것이 없으므로 끌 수는 없고, 누르면 전체 선택이 된다. 판 안에 묶음 제목이 이미 있는 판(색상, 의미 색, 의미 글꼴, 의미 간격)은 종류의 소제목을 따로 두지 않는다.
  - **버튼의 기본 마우스 모양은 base 층에 둔다**(`@layer base { button { cursor: pointer } }`). 층 밖에 적으면 `cursor-grab` 같은 클래스보다 앞서서 잡는 손 모양이 나오지 않는다.
- **간격 판(토대)**: 숫자 이름의 다섯 값을 이름과 길이로 보여 준다. 설명과 예시는 없다(쓰임은 의미 간격 판에 있다). 줄마다 오른쪽에 견본 띠가 있다. 의미 간격 판의 예시와 같은 표시(`{colors.guide}` 30%)이고, 띠의 높이가 그 간격이며 좌우로는 칸 끝까지 길게 긋는다. 차례는 값의 크기순으로 저절로 놓이고 끌 수 없다.
- **의미 간격 판**: 쓰임마다 한 줄이다. 묶음(버튼, 입력칸, 목록, 판, 패널, 창)마다 제목(`{typography.heading}`)을 두고 그 아래에 줄 목록을 놓는다. 묶음 제목을 누르면 그 묶음의 값이 모두 선택된다. 왼쪽 칸(224px)에 이름(`{typography.label}`)·가리키는 간격과 그 길이(`3 · 12px`, `{typography.code-sm}`, `{colors.ink-faint}`. 가리키는 값이 없어졌으면 적힌 그대로 `{colors.danger}`)·설명(`{typography.caption}`, `{colors.ink-faint}`, 뜻의 단위로 줄바꿈), 오른쪽에 예시. 예시가 없는 줄은 왼쪽 칸이 줄 전체를 쓴다. 판은 메뉴에서 간격 바로 아래에 있고, 캔버스에서는 다른 판들의 오른쪽에 놓인다.
  - **예시가 없는 줄**: 의미 간격은 주석에 모양을 적은 값에만 예시를 그린다. 간격은 이름만으로 그림을 정할 수 없어서(`heading`이 무엇의 제목인지) 짐작으로 그리지 않는다. 예시가 없는 줄은 왼쪽 칸이 줄 전체를 쓴다.
  - **추가**: "추가"를 누르면 "의미 간격 추가" 창이 열려 이름, 가리키는 간격(토대의 값 가운데 고른다), 묶음을 정한다. 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다. 숫자로 시작하는 이름은 토대의 이름이라 받지 않는다. 토대의 값이 하나도 없으면 무엇을 먼저 할지 알리고 닫는다.
  - **예시**: 그 간격이 놓인 자리를 그리고, 간격이 차지하는 만큼을 `{colors.guide}` 30%로 칠한다(길이는 값 그대로). FF가 간격을 표시할 때 쓰는 색이며 사용자의 색이 아니다. 모양을 적지 않은 값에는 예시가 없다(위 "예시가 없는 줄"). 쓰임이 여럿이면 예시를 위아래 8px 띄워 쌓는다.
  - **모양은 스물아홉이고, 실제 화면의 조각으로 그린다**: 글자만 늘어놓으면 무엇과 무엇 사이인지 읽히지 않는다. 의미 간격 서른넷 모두에 예시가 있다.
    - **버튼**: 사이(나란한 버튼들 사이. 마지막 버튼은 채운 버튼이다), 버튼(테두리 버튼의 글자 왼쪽과 오른쪽), 채운 버튼(짙은 바탕 위에서도 여백이 보이게 버튼 안쪽에만 `{colors.guide}` 55%를 덧칠한다), 바탕 없는 버튼(마우스를 올린 모습인 옅은 바탕 `{colors.ink}` 8%로 그려 상자가 어디까지인지 보여 준다), 바탕 없는 버튼 사이(둘 다 마우스를 올린 바탕으로 그려 바탕끼리 닿지 않는 것을 보여 준다), 아이콘(바탕 없는 버튼 안의 아이콘과 글자 사이. 아이콘은 네모로 자리만 그린다).
    - **입력칸**: 입력칸(적은 값의 왼쪽과 칸의 오른쪽 끝), 단위(입력칸 안의 값과 단위 사이. 첫 문구가 값, 나머지가 단위), 나란한 칸(가로로 나란한 입력칸 사이), 칩(옅은 바탕 위 짧은 글자의 좌우), 이름표(이름표와 그 아래 입력칸 사이. 첫 문구가 이름표), 칸(이름표가 붙은 입력칸들 사이).
    - **목록**: 줄(줄과 줄 사이. 첫 줄은 마우스를 올린 바탕), 줄 아이콘(메뉴 줄 안의 아이콘과 글자 사이), 줄 좌우, 줄 위아래, 목록 상자(줄들을 담은 상자의 네 가장자리).
    - **판과 패널**: 묶음(제목이 붙은 묶음들 사이), 제목과 내용(제목과 그 아래 내용 사이), 열 사이(한 줄 안의 이름 칸과 옆 칸 사이), 격자(칸과 칸 사이), 격자 줄(줄과 줄 사이), 상자(판·카드·작은 창의 네 가장자리. 문구를 적으면 제목으로 놓고, 없으면 내용 막대만 그린다), 면 좌우·면 위아래(패널 구역의 좌우, 위아래. 제목과 입력칸), 쌓임(위아래로 놓인 글자 줄 사이. 맞는 모양이 없을 때 쓴다).
    - **창**: 면(창의 네 가장자리. 제목, 내용 막대, 아래 오른쪽의 버튼 둘), 버튼 줄(창의 내용과 아래 버튼 줄 사이), 막대 좌우(상단 바, 알림의 좌우).
    - 여럿을 늘어놓는 모양(사이, 쌓임, 이름표, 줄, 칸, 묶음, 바탕 없는 버튼 사이, 목록 상자, 단위, 나란한 칸, 버튼 줄)은 문구를 쉼표로 나눈다.
  - **종류가 다른 것은 다른 모습으로 그린다**: 채운·테두리 버튼의 여백(`button-x`)과 바탕 없는 버튼의 여백(`button-ghost-x`)을 둘 다 테두리 버튼으로 그렸더니, 같은 버튼의 여백이 두 가지인 것처럼 보였다. 예시는 그 간격이 실제로 붙는 물건의 모습이어야 한다. 값이 서로 다른 이유가 물건의 종류에 있을 때는 더 그렇다. 이름도 코드에서 그 버튼을 부르는 말(`ghost`)과 맞춘다.
  - **여백 예시는 무엇의 여백인지로 나눈다**: 처음에는 "좌우 여백", "안쪽 여백"처럼 방향으로 나누고 상자 전체를 칠했는데, 그림이 버튼인지 입력칸인지 패널인지 알 수 없었고 칠한 색이 상자의 색처럼 보였다. 그래서 실제 모습(테두리 `{colors.ink}` 32%)으로 그리고 그 위에 여백 자리만 칠한다.
  - **칠하는 자리는 모두 길게 긋는다**: 간격의 방향으로는 값만큼, 그 가로지르는 방향으로는 예시 상자의 끝에서 끝까지다. 가로 간격(사이, 버튼·입력칸·면의 좌우 여백)은 위에서 아래까지의 세로 띠, 세로 간격(쌓임, 면의 위아래 여백)은 왼쪽에서 오른쪽까지의 가로 띠. 면의 네 가장자리는 세로 띠 둘과 가로 띠 둘이 모서리에서 겹친다. 어떤 것은 길게, 어떤 것은 그 물건의 크기에 딱 맞게 그으면 한 판 안에서 표시가 두 가지 말이 되어 어색하다(가로 띠만 길고 세로 띠는 짧았던 때가 있었다). 딱 맞게 통일하는 것보다 길게 통일하는 쪽이 4px 같은 좁은 간격도 눈에 띈다.
  - **예시의 내용은 예시 상자의 가운데에 놓는다(효과 판과 간격 판)**: 이 두 판의 예시는 읽는 글이 아니라 물건 하나(버튼, 창, 카드)를 놓아 보여 주는 것이다. 왼쪽에 붙이면 오른쪽만 비어, 물건을 보여 주는 자리가 아니라 내용이 덜 찬 줄처럼 보인다. 그림자는 사방으로 지고 간격의 띠는 양쪽 끝까지 뻗으므로, 둘레가 고르게 비어 있어야 치우침 없이 보인다. 의미 색과 의미 글꼴 판의 예시는 글자가 주인공이고 글은 왼쪽에서 읽기 시작하므로 왼쪽에 맞춘 그대로 둔다. 화면을 덮는 예시(가림막, 겹침)는 상자를 가득 채운다.
  - **주석**: `묶음(모양): 설명 | 문구 | 모양: 문구`. 예) `--spacing-actions: var(--spacing-2); /* 버튼(사이): 나란한 버튼 사이 | 취소, 추가 */`. 묶음은 버튼, 입력칸, 목록, 판, 패널, 창. 적지 않으면 이름에서 짐작한다. 파일 맨 위의 안내(`ff:guide`)에도 같은 형식이 적혀 있다.
  - **패널**: 이름, 가리키는 간격(고르는 칸. 줄마다 숫자 이름과 길이), 묶음, 설명, 쓰이는 곳, 코드. 설명이나 묶음을 고쳐도 같은 주석의 예시(모양과 문구)는 그대로 남는다. 예시는 패널에서 고치지 않는다. 코드에는 `gap-이름`, `px-이름`, `var(--spacing-이름)`을 적는다.
  - **차례**: 쓰임으로 이름 붙인 종류라 손으로 바꾼다. 줄을 끌면 같은 묶음 안에서 차례가 바뀐다(끄는 줄은 40%로 옅어지고 놓일 자리에 선이 보인다). 다른 묶음으로는 끌어 옮기지 않는다. 묶음은 그 간격이 무엇에 딸렸는지라서 패널의 "묶음"에서 바꾼다. 묶음 제목을 끌면 묶음의 차례가 바뀐다. "원래대로"는 묶음을 버튼, 입력칸, 목록, 판, 패널, 창의 차례로, 묶음 안의 줄을 가리키는 길이가 작은 것부터 놓는다(길이가 같으면 지금 차례 그대로).
- **효과의 추가**: 그림자, 투명도, 흐림의 "추가"는 값을 바로 만들지 않고 창을 연다("그림자 추가", "투명도 추가", "흐림 추가"). 창은 두 칸이다. **쓰임**(그 종류의 예시 모양을 고르는 칸. 그림자는 메뉴·창·알림·카드, 투명도는 꺼짐·가림막·겹침, 흐림은 유리)과 **이름**. 효과는 단계가 아니라 쓰임으로 이름 붙이므로 무엇에 쓸지를 먼저 묻는다. 쓰임을 고르면 이름이 그 쓰임의 이름으로 채워지고(`float`, `dialog`, `toast`, `card`, `disabled`, `scrim`, `layer`, `glass`), 이름을 직접 고친 뒤에는 쓰임을 바꿔도 따라 바뀌지 않는다. 그 이름이 이미 있으면 이름 칸을 비워 둔다. 처음 골라져 있는 쓰임은 아직 만들지 않은 첫 쓰임이다. "추가"를 누르면 그 쓰임의 추천 값과 설명, 예시 모양을 갖춘 값이 생긴다(주석은 `그림자(알림): 잠깐 떴다 사라지는 알림`). 값은 창에서 묻지 않고 만든 뒤에 패널에서 고친다.
  - **추천 값**: 그림자는 모두 두 겹이고, 멀리 뜬 것일수록 뒤의 겹이 넓고 진하다. 카드 `0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04)`, 메뉴 `0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)`, 알림 `0 2px 4px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.08)`, 창 `0 2px 4px rgb(0 0 0 / 0.04), 0 8px 32px rgb(0 0 0 / 0.1)`. 투명도는 꺼짐 0.4, 가림막 0.4, 겹침 0.8. 흐림은 유리 12px.
  - **한 벌 만들기를 두지 않는 이유**: 한 벌 만들기는 규칙 하나에서 여러 값이 나올 때 쓸모가 있다(글자 크기는 기준 크기와 단계 사이에서 모든 단계가 나온다). 효과의 값들은 서로에게서 계산되지 않고 쓰임마다 따로 정한 값이며, 개수도 적다. 쓰임을 골라 추천 값으로 만드는 "추가"가 그 일을 대신한다.
- **오른쪽 패널의 구역(값, 의미 색, 의미 글꼴)**: 무엇을 골라도 구역이 같은 차례로 나온다: 이름, 값(색 값 / 가리키는 색과 역할 / 조합과 묶음 / 크기), 설명, 쓰이는 곳, 코드. 그 종류에 없는 구역은 빠질 뿐 차례는 바뀌지 않는다. 판을 옮겨 다녀도 같은 자리에 같은 것이 있어야 눈이 찾는 일이 줄어든다. 고치는 구역(이름, 값, 설명)은 늘 펼쳐 두고, 보기만 하는 구역(쓰이는 곳, 코드)은 접을 수 있으며 접은 상태는 다른 값을 골라도 기억한다(쓰이는 곳은 처음에 펼쳐져 있고 코드는 접혀 있다). **"쓰인 모습" 구역은 어느 패널에도 두지 않는다.** 패널은 값을 고치는 곳이고, 구역이 늘수록 고칠 칸을 찾기 어려워진다. 쓰인 모습은 그것을 보며 판단하는 자리에서 보여 준다: 의미 색과 의미 글꼴은 판의 줄마다 있는 예시, 색은 색 선택 창, 글꼴 종류는 글꼴 추가 창. 쓰이는 곳은 제목 줄 오른쪽에 쓰는 곳의 수를 옅게 적어 접어 두어도 보이게 하고, 쓰는 곳이 없으면 "없음"이라고만 적힌 한 줄로 남는다(누를 수 없고 안내 문장을 따로 두지 않는다). 색 선택 창의 쓰인 모습은 카드 하나다(버튼과 비활성, 큰 글자와 작은 글자, 테두리와 옅은 배경). 밝은 바탕과 어두운 바탕을 위아래로 다 늘어놓지 않는다. 패널의 절반을 차지해서 값을 고치러 온 패널에서 견본이 주인공이 된다. 바탕은 밝은 것이 처음이고, 카드 오른쪽 위의 해·달 버튼으로 바꿔 보며 고른 쪽을 기억한다(패널과 색 선택 창이 함께 쓴다).
- **가리키는 값으로 가기**: "쓰이는 곳"이 이 값을 쓰는 쪽으로 가는 길이라면, 이것은 반대로 이 값이 가리키는 쪽으로 가는 길이다. 의미 색 패널의 "가리키는 색" 줄 오른쪽 끝, 의미 글꼴 패널의 글꼴 종류·글자 크기·굵기를 고르는 칸 옆에 화살표 버튼(32px)이 있다. 의미 글꼴 패널에서는 고르는 칸과 4px, 의미 색 패널에서는 같은 줄의 # 값과 8px 띄운다. 누르면 그 값이 있는 판(색상 판, 글꼴 판)으로 가서 그 값을 고르고 화면 가운데에 놓는다. 가리키는 값이 없어졌으면 갈 곳이 없어 버튼이 꺼진다. 건너뛴 것이므로 뒤로(Alt+←)로 돌아올 수 있다.
- **뒤로와 앞으로**: "쓰이는 곳"의 항목이나 "가리키는 값으로 가기" 버튼을 누르거나 찾기로 다른 값이나 컴포넌트로 건너뛰면, 떠나온 자리(어느 화면에서 무엇을 골라 두었는지)를 기억한다. 상단 바 왼쪽, 디자인 시스템 이름 옆의 ← → 버튼이나 Alt+←, Alt+→로 그 자리로 돌아가고 다시 간다(브라우저와 같다). 돌아가면 그때 골라 두었던 것이 다시 골라지고, 값 하나였으면 화면 가운데로 온다. 그 사이에 지워진 값은 고르지 않는다. 갈 곳이 없으면 버튼이 꺼져 있다. 뒤로 간 뒤에 다른 곳으로 건너뛰면 앞으로 갈 곳은 비워진다. 쉰 곳까지 기억하고, 디자인 시스템을 바꾸면 비운다. 왼쪽 메뉴를 눌러 화면을 옮기는 것은 기억하지 않는다. 메뉴는 늘 보여서 돌아가는 길이 따로 필요 없고, 건너뛴 자리만 쌓여야 되짚기가 쉽다. 값을 고치는 것을 되돌리는 Ctrl+Z와는 별개다.
  - **추가**: 기본 한 벌 가운데 아직 없는 첫 번째가 생긴다. 모두 있으면 본문과 같은 조합이 `custom`이라는 이름으로 생긴다.
  - **따라가기**: 가리키는 글꼴 종류, 글자 크기, 굵기의 이름을 바꾸면 의미 글꼴이 새 이름을 따라간다. 의미 글꼴이 가리키는 값을 지우려 하면 컴포넌트가 쓰는 값처럼 먼저 묻는다. 글꼴 판에서 값을 선택하면 패널의 "쓰이는 곳"에 그것을 가리키는 의미 글꼴이 나온다.
  - **컴포넌트에서**: 컴포넌트의 글자는 크기마다 의미 글꼴 하나를 골라 정한다(패널 "글자" 구역의 "의미 글꼴"). 고르면 글꼴, 굵기, 크기, 줄 높이, 글자 사이가 모두 그 조합을 따르고, 따로 고르는 "글꼴", "굵기", "크기" 칸은 쓰이지 않으므로 숨는다. "따로 고르기"로 두면 전처럼 세 칸이 보인다. 내보내는 CSS에서는 그 크기의 규칙에 `font: var(--type-이름)`과 `letter-spacing: var(--type-이름--letter-spacing, normal)`이 적힌다. 의미 글꼴의 이름을 바꾸면 컴포넌트가 따라가고, 컴포넌트가 쓰는 의미 글꼴을 지우려 하면 먼저 묻는다. 의미 글꼴의 패널에는 그것을 쓰는 컴포넌트가 "쓰이는 곳"에 나온다.
- **글꼴 종류 추가 창과 한 벌 만들기 창들의 관계**: 틀과 부품이 같다. 왼쪽 열(224px)에 설정이 있고(이름표는 값 위, 설정 사이 16px), 아래 버튼 줄은 창의 폭을 다 써서 왼쪽 끝에 "원래대로", 오른쪽 끝에 "취소"와 주 버튼이 있다. "원래대로"는 네 창(글자 크기, 굵기, 의미 글꼴, 글꼴 종류 추가) 모두 이 자리에 있고, 바꾼 것이 없으면 꺼져 있다. 창의 높이는 세 창(글자 크기, 의미 글꼴, 글꼴 종류 추가)이 화면에 맞춰 고정이고, 굵기 창은 내용만큼이다. -, + 조절의 값 자리는 80px이다. 이름 칸은 놓이는 자리에 따라 둘이다. 표의 줄 안에 끼워 넣는 이름은 작은 고정폭 칸(높이 24px)이고, 이름표 아래에 혼자 놓이는 이름(글꼴 종류 추가 창)은 패널의 입력칸과 같은 칸(높이 32px, 열의 폭을 다 씀, 14px)이다. 다른 것은 내용뿐이다. 한 벌 만들기 창들은 규칙으로 값을 만들어 내는 창이라 설정이 여럿이고, 글꼴 종류 추가 창은 후보를 견줘 하나를 고르는 창이라 설정이 셋(이름, 견본 크기, 견본 굵기)뿐이다. 이 창의 주된 일은 글꼴을 고르는 것이라 왼쪽 열의 맨 위에 찾기와 목록이 오고, 설정은 그 아래 구분선 밑에 둔다. 견본도 후보 셋을 좁은 카드에 나란히 놓아야 해서 `type-screen`이 아니라 `font-sample`을 쓴다.
- **글꼴 종류 추가 창의 간격**: 한 벌 만들기 창들과 같은 값을 쓴다. 카드의 안쪽 여백은 좌우 16px, 위아래 12px(표 상자와 같다), 카드와 카드 사이는 8px(상자와 상자 사이), 글꼴 이름과 견본의 첫 줄 사이는 16px이다. 왼쪽 열의 설정 사이는 16px이고, 설정과 목록 사이는 구분선을 두고 위아래 16px씩 띄운다. 간격으로 쓰는 값은 4, 8, 12, 16, 24px이고 그 밖의 값은 쓰지 않는다.
- **글꼴 종류 추가**: 글꼴 종류는 바로 만들지 않고 "글꼴 종류 추가" 창(너비 1440px, 화면이 좁으면 그만큼 줄인다)에서 정한다. 글꼴 파일을 가져오는 일은 코드를 짤 때 AI가 하므로, 이 창이 할 일은 어떤 글꼴을 고를지 판단하게 해 주는 것이다. 색을 고를 때 `color-uses`를 보여 주듯, 글꼴은 쓰인 모습(`font-sample`)으로 보여 주고 후보끼리 나란히 견주게 한다. 정할 것은 글꼴 하나뿐이다. 이름과 대체 글꼴은 묻지 않고 붙인다. 왼쪽 열(너비 224px)에 글꼴 목록이 있고 오른쪽에 후보 세 자리가 나란히 있다.
  - **글꼴 목록**: 오른쪽 카드와 같은 높이(최소 320px). 추천 글꼴을 성격별 묶음(담백한 고딕, 부드러운 고딕, 명조, 영문, 고정폭)으로 먼저 보여 주고(지금 새 제품에서 고를 만한 글꼴만 둔다. 2010년 무렵의 나눔 계열과 포스터용 장식 글꼴은 넣지 않는다. 목록에서는 보통 굵기만 불러오고, 후보로 고른 글꼴과 이 시스템이 쓰는 글꼴만 모든 굵기로 불러온다. 한꺼번에 다 청하면 받아야 할 목록만 3MB를 넘는다) 그 아래에 "내 컴퓨터" 묶음을 둔다. 추천 글꼴은 널리 쓰이는 무료 글꼴이고, 깔려 있지 않아도 인터넷(구글 글꼴, jsDelivr)에서 불러와 그린다. 줄마다 그 글꼴로 이름을 적는다. 이름은 `font-sample`의 버튼처럼 줄 상자의 위아래 여백을 잘라 내고 가운데에 놓는다(글꼴에 따라 위로 2px에서 아래로 2.5px까지 치우치던 것을 없앤다). 줄(높이 32px) 사이는 4px 띄워서 고른 줄끼리, 또는 고른 줄과 마우스를 올린 줄의 바탕이 닿지 않게 한다. 위의 찾기 칸에 적으면 목록이 좁혀진다. 줄을 누르면 후보로 들어가고(`{colors.selection-soft}` 바탕과 체크 표시), 다시 누르면 빠진다. 찾는 글꼴이 목록에 없으면 목록 자리에 "목록에 없는 글꼴이에요. AI에게 추가해 달라고 하세요."라고 알린다. 이름만 적어 넣는 길은 두지 않는다. 불러올 곳을 모르는 글꼴은 견본이 다른 글꼴로 그려져 견주는 뜻이 없기 때문이다. 목록에 있는 글꼴은 사람이 바로 견주어 추가하고, 없는 글꼴은 AI가 찾아서 넣는다. (FF는 쓰는 법을 설명하는 문구를 두지 않지만, 이 문구는 막힌 자리에서 다음에 할 일을 알리는 것이라 예외다.) "내 컴퓨터"는 깔린 글꼴 전부가 아니라 흔한 글꼴 가운데 이 컴퓨터에 있는 것들이다. 깔린 글꼴 전체는 브라우저의 허락을 받아야 읽을 수 있는데, 그 허락을 청하는 버튼은 두지 않는다.
  - **후보 견주기**: 후보는 세 개까지다. 자리마다 카드 하나(모서리 `{rounded.md}`, 1px `{colors.hairline}` 선, 안쪽 여백 좌우 16px·위아래 12px, 카드 사이 8px)에 글꼴 이름과 같은 `font-sample`을 그려서 같은 자리끼리 견주어 볼 수 있다. 빈 자리는 점선 테두리만 있다. 카드를 누르면 그 글꼴로 정해지고 `{colors.selection}` 2px 테두리가 생긴다(테두리 1px에 안쪽으로 1px을 더 긋는다. 바깥으로 그으면 스크롤되는 영역의 가장자리에서 잘린다. 견본의 바탕색 위에 덧그려서 가려지지 않게 한다). 누르기 전에는 어느 카드도 정해진 것으로 표시하지 않는다(처음 넣은 후보가 저절로 정해지지 않는다). 정한 카드를 다시 누르거나 창 안의 빈 곳(빈 자리, 카드 사이, 여백)을 누르면 풀린다. 캔버스에서 빈 곳을 눌러 선택을 푸는 것과 같다. 버튼, 입력칸, 목록의 줄, 조절 칸을 누르는 것으로는 풀리지 않는다. 후보가 둘 이상인데 정하지 않고 추가하려 하면 카드를 눌러 정해 달라고 알린다. 이 알림과 "글꼴을 골라 주세요." 알림은 창 아래 오른쪽, 취소·추가 버튼 바로 왼쪽에 뜬다(누르려던 버튼 옆이라 놓치지 않는다). 후보가 하나뿐이면 누르지 않아도 그것으로 만든다. 바꾸는 창에서는 지금 글꼴이 정해진 채로 시작한다. 카드 오른쪽 위의 X로 후보에서 뺀다. 빼면 그 자리만 비고 옆의 카드가 당겨지지 않는다. 새 후보는 가장 앞의 빈 자리에 들어간다. 카드는 끌어서 자리를 옮기지 않는다. 후보가 셋뿐이라 어느 자리에 있든 한눈에 견줄 수 있고, 카드의 순서는 만들어지는 값에 들어가지 않는다. 끌어 옮기기를 두면 카드를 눌러 정하는 것과 조작이 겹친다. 자리가 다 차면 더 넣을 수 없다. 목록에서 후보가 아닌 줄은 옅어지고(40%) 눌러도 아무 일도 일어나지 않는다. 있던 후보가 저절로 빠지고 바뀌지 않게, 카드의 X나 목록의 고른 줄을 눌러 자리를 낸 뒤에 넣는다. 후보를 고르기 전에는 세 자리 모두 비어 있고, 그대로 추가하려 하면 글꼴을 골라 달라고 알린다.
  - **굵기도 바꿔 가며 본다**: 왼쪽 열의 "견본 크기" 아래에 "견본 굵기" 조절 칸이 있다. -, + 버튼으로 100씩, 100에서 900까지 바꾸고, 견본의 읽는 글(문단, 머리말, 주문 번호, 입력칸)이 그 굵기로 바뀐다. 상품 이름과 금액(600), 버튼과 이름표와 상태 표시(500)는 제 굵기 그대로 두어 견줄 기준으로 삼는다. 굵기는 늘어놓은 줄로 보는 것보다 실제 글이 얇아지고 굵어지는 것을 봐야 판단할 수 있다. 그 굵기가 없는 글꼴은 가장 가까운 굵기로 그려진다. 처음은 400이고 저장되지 않는다. 견본은 한 쪽에 다 담는다(글과 굵기를 나눠 전환하지 않는다).
  - **견본을 보는 방식**: 왼쪽 열의 목록 아래, 이름 아래에 "견본 크기"(12px에서 20px, 처음은 16px)와 "견본 굵기"(100에서 900, 100씩, 처음은 400)가 있다. 둘 다 저장되는 값이 아니라 견본을 보는 방식이다. 크기를 바꾸면 견본 전체가 같은 비율로 커지거나 작아지고, 굵기는 읽는 글(문단, 머리말, 주문 번호, 입력칸)의 굵기를 바꾼다. 색은 고르지 않는다. 견본은 늘 이 시스템의 기본 글자색과 바탕색으로 그린다. 글꼴을 고르는 데 필요한 것은 크기와 굵기에 따른 모양이고, 색 조합과 글자색, 바탕색까지 바꿔 보게 하면 설정이 창의 주인공이 되어 후보를 견주는 일이 가려진다.
  - **이름은 미리 채워져 있다**: 왼쪽 열의 목록 아래에 "이름" 칸이 있고(열의 폭 224px을 다 쓴다), 정한 글꼴의 갈래로 미리 채워져 있다. 그대로 두어도 되고 비워 두어도 되며(그러면 채워 주던 이름을 쓴다), 바꾸고 싶을 때만 고친다. 직접 고치기 전까지는 글꼴을 바꿀 때마다 따라 바뀐다. 이름은 꼭 적어야 하는 것이 아니다. 채워지는 이름은 이렇게 정한다. 고딕이면 `sans`, 명조면 `serif`, 고정폭이면 `mono`. 그 이름이 이미 있으면 고딕과 명조는 `display`, 그것도 있으면 `sans2`처럼 번호를 붙인다. 추천 글꼴은 갈래가 정해져 있고, 그 밖의 글꼴은 이름에서 짐작한다(mono, code 등이 들어가면 고정폭, 명조·serif 등이 들어가면 명조, 나머지는 고딕). 만든 뒤에는 패널에서 바꾼다.
  - **대체 글꼴도 자동**: 정한 글꼴이 없는 기기에서 차례로 쓰일 글꼴들을 갈래에 맞춰 뒤에 붙인다. 고정폭이면 `ui-monospace, Consolas, monospace`, 명조면 `Georgia, serif`, 고딕이면 `system-ui, sans-serif`. 창에는 고치는 칸이 없고, 고칠 일이 생기면 패널의 값 칸에서 고친다.
  - 빈칸이 있거나 숫자로 시작하는 낱말이 든 글꼴 이름은 값에 큰따옴표로 감싸 적는다.
- **이 시스템의 글꼴 (`fonts.css`)**: 디자인 시스템 폴더의 `fonts.css`는 그 시스템이 쓰는 글꼴을 불러오는 코드다. `tokens.css`에는 글꼴의 이름만 있어서, 그 글꼴을 어디서 가져오는지는 이 파일이 맡는다. 웹에서 원래 쓰는 코드 그대로다. 웹 글꼴 주소는 `@import url('https://...');`(파일 맨 위), 배포처가 준 코드는 `@font-face { ... }`, 글꼴 파일은 폴더의 `fonts/`에 넣고 `@font-face`에서 `url('./fonts/파일.woff2')`로 가리킨다. 실제 서비스에서도 이 파일을 그대로 가져다 쓴다.
  - **누가 고치나**: AI나 사람이 직접 고친다. FF에는 글꼴 파일을 올리거나 코드를 붙여 넣는 화면이 없다. 목록에 없는 글꼴을 쓰고 싶으면 AI에게 추가해 달라고 하고, AI는 이 파일에 적는다. 파일 맨 위의 주석에 적는 방법이 있어서 AI가 파일을 열면 읽게 된다.
  - **FF가 하는 일**: 시스템을 열 때와 이 파일이 밖에서 바뀔 때 읽어서 화면에 불러온다(값이 아니므로 "밖에서 바뀌었어요" 알림은 띄우지 않고 조용히 다시 읽는다). 그래서 깔려 있지 않은 글꼴도 판과 패널의 견본이 그 글꼴로 그려진다. 파일 안의 글꼴 이름(`@font-face`의 `font-family`, 구글 글꼴 주소의 `family`, 그 밖의 주소는 내용을 받아서 읽은 이름)이 "글꼴 종류 추가" 창의 맨 위 묶음 "이 시스템의 글꼴"이 되어, 추천 글꼴과 똑같이 후보로 견줄 수 있다. 같은 글꼴은 아래 묶음에 또 나오지 않는다.
  - **추천 글꼴을 골랐을 때**: 창에서 추천 글꼴을 정해 추가하거나 바꾸면, FF가 그 글꼴을 불러오는 `@import` 한 줄을 이 파일 맨 위에 덧붙인다(파일이 없으면 안내 주석과 함께 만든다). FF가 이 파일에 쓰는 것은 이것뿐이고, 이미 있는 내용은 건드리지 않는다.
- **대체 글꼴은 화면에 보이지 않는다.** 파일에는 `"SUIT Variable", system-ui, sans-serif`처럼 대체 글꼴까지 적히지만, 대체 글꼴은 자동으로 붙는 안전장치라 사람이 판단할 것이 없다. 색을 oklch로 저장하고 #으로 보여 주는 것처럼, 화면에는 정한 글꼴의 이름만 보여 준다. 글꼴 판의 줄에는 `SUIT Variable`, 패널에는 글꼴 이름만 나온다. 정한 글꼴 없이 대체 글꼴뿐인 값은 "기기 기본 글꼴"이라고 적는다. 전체 값은 패널의 "코드" 구역(접혀 있음)의 "저장된 값"에서만 보인다. 대체 글꼴을 고치려면 `tokens.css`를 직접 고치거나 AI에게 시킨다.
- **패널에서 글꼴 바꾸기**: 글꼴 종류를 선택하면 패널에는 값을 적는 칸이 없고, 정한 글꼴의 이름과 그 아래 "글꼴 고르기" 버튼이 있다. 글꼴은 적는 것이 아니라 고르는 것이다. 누르면 추가할 때와 같은 견주기 창이 "○○의 글꼴"이라는 제목으로 열린다. 이름은 그대로고, 지금 글꼴이 첫 후보로 들어가 있다. 대체 글꼴은 새로 정한 글꼴의 갈래에 맞춰 바뀌지만, 손수 적어 둔 대체 글꼴이 있으면 그대로 둔다. 다른 후보를 넣어 견준 뒤 "바꾸기"를 누르면 값이 바뀐다. 글꼴이 쓰인 모습(`font-sample`)은 이 창에서만 보여 주고, 오른쪽 패널에는 두지 않는다. 추천 글꼴을 쓰는 글꼴 종류가 하나라도 있으면 그 글꼴을 인터넷에서 불러와, 깔려 있지 않아도 판과 패널의 견본이 그 글꼴로 그려진다.
- **`font-sample`**: 글꼴이 쓰인 모습. 글꼴은 문장 한 줄로는 차이가 보이지 않아서 실제 화면에서 만나는 자리들에 놓아 보여 준다. 부품을 따로따로 늘어놓지 않고 주문 한 건을 보는 화면 하나로 잇는다. 한 벌 만들기 창들의 화면 예시와 같은 가게의 화면이다. 위에서부터 머리말(`최근 주문 · 2분 전`), 상품 이름, 금액과 수량과 그 줄 오른쪽 끝의 상태 표시(`결제 완료`), 안내 문단(한글 두 문장과, 그것을 그대로 옮긴 영문 두 문장)과 그 아래의 `더 보기`, 받는 분(작은 이름표, 입력칸과 그 옆의 `바꾸기`), 주문 번호와 날짜(작은 글자), 맨 아래의 버튼 줄(`배송 준비`가 남는 폭을 차지하고 그 옆에 `출고 완료`)이 한 화면이다. 버튼과 입력칸은 종류별로 줄 세워 늘어놓지 않고 화면에서 실제로 놓이는 자리에 둔다. 다섯 가지 버튼 모양이 저마다 제자리에 있다: 연한 배경은 금액 옆의 상태 표시, 투명은 문단 아래, 보조(테두리만)는 입력칸 옆, 주요와 비활성은 맨 아래. 입력칸은 줄을 혼자 다 차지하지 않고 버튼과 한 줄을 이룬다. 카드의 맨 아래에는 옅은 선을 긋고 이 글꼴에 대한 것 하나를 둔다: 굵기 한 줄. 카드의 높이가 남으면 화면과 굵기 줄 사이가 벌어지고 굵기 줄은 늘 맨 아래에 붙는다. 화면에 속한 것과 글꼴에 대한 것을 섞으면 무엇을 보라는 것인지 흐려진다. 헷갈리기 쉬운 글자(`Il1 O0 rn`)는 따로 두지 않는다.
  - **견본도 한 벌 만들기 창들의 규칙을 따른다**: 견본끼리 규칙이 다르면 같은 값이 창마다 다르게 보인다. **크기**는 이 시스템의 크기 가운데 16px에 가장 가까운 것을 본문으로 보고 거기서 몇 단계 떨어졌는지로 고른다(의미 글꼴 한 벌과 같은 짝): 머리말과 주문 번호와 상태 표시는 두 단계 아래(xs), 이름표와 버튼은 한 단계 아래(sm), 문단과 입력칸과 입력칸 옆의 버튼은 본문(base), 금액은 한 단계 위(lg), 상품 이름은 세 단계 위(2xl). 줄 높이는 그 크기에 묶인 값이다. **굵기**는 굵기 한 벌의 3단계와 같다: 읽는 글은 창에서 고른 굵기(처음은 400), 버튼과 이름표와 상태 표시는 500, 상품 이름과 금액은 600. 700은 쓰지 않는다. **상자**는 글자 크기 한 벌의 예시 상자와 같다: 높이는 그 크기의 줄 높이에 위아래 여백을 더한 것(버튼과 입력칸은 8px씩, 상태 표시는 4px씩), 좌우 여백은 높이의 0.4배(입력칸은 0.34배)를 짝수 px로 맞춘 것. 본문 16px의 한 벌이면 버튼 36px, 입력칸과 그 옆의 버튼 40px, 상태 표시 24~28px이다. **여백**은 견본 화면의 여백 규칙이다: 머리말과 상품 이름 사이, 문단과 `더 보기` 사이는 0, 상품 이름 → 금액 → 문단, 이름표 → 입력칸은 4px, 덩어리 사이(문단 묶음 → 받는 분 → 주문 번호 → 버튼 줄)는 16px. 문단의 높이는 정해 두지 않는다. 나란히 놓인 카드들이 격자의 줄을 함께 써서, 글꼴마다 줄 수가 달라도 아래 줄들이 같은 높이에 온다. 창의 "크기" 조절은 본문 크기를 기준으로 견본 전체를 같은 비율로 키우거나 줄이고, 처음(16px)에는 비율이 1이다.
  - **크기와 색**: 글자 크기와 줄 높이는 이 디자인 시스템의 글자 크기 값을 따른다. 가장 작은 크기가 작은 글자, 그다음이 본문(버튼, 입력칸, 숫자도), 그다음이 작은 제목(굵기 줄의 글자도), 가장 큰 크기가 큰 제목이다. 크기가 셋뿐이면 작은 제목과 큰 제목이 같은 크기가 된다. 글자 크기 값이 하나도 없으면 12, 14, 16, 24px로 그린다. 색도 이 시스템의 기본 글자색과 바탕색이다(`role-sample`과 같은 규칙으로 찾는다). 버튼은 글자색을 바탕으로, 바탕색을 글자로 뒤집어 그리고, 입력칸 테두리와 옅은 글자는 글자색을 묽게 한 것이다. 그래서 견본은 고정된 예시가 아니라 내 값으로 그린 화면 조각이다.
  - **굵기 한 줄**: 이 글꼴에 굵기가 몇 단계 있는지를 한 줄로 보여 준다. 100부터 900까지 아홉 칸이고, 칸마다 그 굵기로 쓴 `가`와 그 아래 굵기 숫자(`{typography.code-sm}`, 고정폭 12px)가 있다. 그 글꼴에 없는 굵기는 글자를 비우고 숫자만 아주 옅게 남긴다. 지금 읽는 글이 실제로 그려지고 있는 굵기의 숫자에 밑줄을 긋는다. 조절 칸에서 청한 굵기가 그 글꼴에 없으면 브라우저가 가까운 굵기로 대신 그리는데, 밑줄은 없는 칸이 아니라 그 대신 그려지는 굵기의 칸에 간다(굵기가 400뿐인 글꼴은 무엇을 청해도 400에 밑줄). 추천 글꼴은 정해 둔 굵기 목록을, 그 밖의 글꼴은 불러온 글꼴 정보에서 읽은 굵기를 쓰고, 알 수 없으면 400과 700 둘만 있는 것으로 본다. 굵기를 아홉 줄로 늘어놓지 않는 것은 그 줄들이 견본의 절반 가까이를 차지해서, 키우면 한 화면에 들어가지 않기 때문이다.
  - **줄의 높이**: 견본의 모든 줄은 높이가 고정이다. 한 줄짜리는 그 줄 높이 그대로(`1lh`), 본문 문단은 글꼴이 아니라 크기에 따라 줄 수를 정해 둔다(기본 크기에서 네 줄, 20px에서 다섯 줄). 글꼴마다 글자가 차지하는 높이가 달라 줄 상자가 1~2px씩 커지고 문단의 줄 수도 달라지는데, 그대로 두면 후보를 넣고 뺄 때마다 줄들이 위아래로 움직인다. 나란히 놓은 카드들은 한 격자의 줄을 함께 써서(CSS subgrid) 좌우로도 정확히 같은 높이에 온다. 문단 말고는 줄이 바뀌지 않게 짧은 글을 쓴다.
  - **글자 높이 맞춤**: 견본의 모든 줄은 줄 상자의 위아래 여백을 잘라 내고 글자(대문자 높이에서 기준선까지)를 줄의 가운데에 놓는다. 글꼴마다 글자 위아래에 잡아 둔 여백이 달라서, 그대로 두면 같은 줄인데도 Pretendard는 Noto Sans KR보다 1.5px 위에 앉는 식으로 어긋난다. 나란히 견줄 때 그 차이가 글꼴의 모양보다 먼저 보이므로 없앤다. 본문 문단은 첫 줄의 위 여백을 잘라 내고 `(줄 높이 - 대문자 높이) / 2`만큼 다시 띄워 같은 높이에서 시작하게 한다.
  - **버튼**: 버튼 모양은 다섯이고, 나란히 늘어놓지 않고 화면의 제자리에 둔다(위 `font-sample`). 주요 버튼(글자색을 바탕으로, 바탕색을 글자로 뒤집음)과 비활성 버튼(주요 버튼을 40%로 흐리게)은 맨 아래 줄, 보조 버튼(1px 테두리만)은 입력칸 옆, 투명 버튼(글자만)은 문단 아래, 연한 배경(글자색을 10% 깐 바탕)은 금액 옆의 상태 표시다. 굵기는 모두 500이다. 버튼마다 글자가 놓이는 조건이 달라서 함께 본다. 옅어진 상태에서도 글자가 읽히는지는 글꼴에 따라 다르다. 입력칸은 보조 버튼과 한 줄을 이룬다.
  - **가운데 맞춤**: 버튼과 입력칸 안의 글자는 그 글자의 실제 모양을 재서 상자의 한가운데에 놓는다. 먼저 줄 상자의 위아래 여백을 잘라 내고(`text-box: trim-both cap alphabetic`) 영문 대문자 높이 기준으로 가운데에 놓은 뒤, 그 글(예: "저장하기")을 그 글꼴과 굵기로 그렸을 때 모양의 가운데가 대문자의 가운데에서 벗어난 만큼을 되돌린다. 한글은 영문 대문자와 높이와 자리가 달라서 대문자 기준만으로는 위로 붙어 보인다. 글꼴이 불려 온 뒤에 다시 잰다. 글꼴마다 글자 위아래에 잡아 둔 여백이 달라서 그대로 두면 글꼴에 따라 1~2px씩 위나 아래로 치우쳐, 글꼴의 모양이 아니라 치우침이 먼저 눈에 띄기 때문이다. 실제 서비스의 버튼에도 같은 처리를 넣어야 견본과 같아진다.
  - **창에서의 크기**: "글꼴 종류 추가" 창의 높이는 글자 크기 한 벌 만들기처럼 화면에 맞춰 고정한다(화면 높이 - 48px). 목록과 카드 영역이 남는 높이를 채운다. 고른 글꼴이나 견본 크기에 따라 창이 늘었다 줄었다 하지 않는다. 본문 12px부터 20px까지 어느 크기에서도 견본이 스크롤 없이 카드에 다 들어간다.
- **오른쪽**: 선택한 값의 이름(색은 목록과 이름 두 칸), 값 입력칸(색은 오른쪽에 스포이드 버튼), **쓰이는 곳**, 접어 두는 "코드" 구역(변수 이름(`token-chip`)과 `var(--이름)`을 복사하는 버튼, 저장되는 파일)의 차례다. 쓰이는 곳은 이 값을 쓰는 컴포넌트와 그 자리(예: primary · 기본 · 바탕색)를 보여 주고, 컴포넌트 이름을 누르면 그 컴포넌트로 이동한다. 컴포넌트가 쓰거나 의미 색·의미 글꼴이 가리키는 값을 지우려 할 때만 확인 창이 떠서 어디에서 쓰는지 알려 준다. 그 밖의 삭제는 묻지 않고 바로 된다.

### 컴포넌트 화면
컴포넌트는 FF 안에서 빈 상자부터 만든다. 구조는 상자 하나에 아이콘과 글자이며, 설정은 디자인 시스템 폴더의 `components.json`에 저장한다.
- **값**: 모든 속성은 기본 값 중에서만 고른다. 직접 적는 값은 받지 않는다. 고른 값이 없어지면 그 칸에 안내를 띄운다.
- **종류와 크기**: 종류(예: primary)는 상태별 바탕색·글자색·테두리색을, 크기(예: md)는 좌우·위아래 여백, 글자 크기, 아이콘과 글자 사이를 맡는다. 글꼴, 굵기, 모서리, 테두리 굵기, 아이콘은 컴포넌트 공통이다.
- **상태**: 기본, 마우스 올림, 누름, 비활성. 기본이 아닌 상태에서 비운 색은 기본 상태의 색을 따른다.
- **왼쪽**: 메뉴 아래에 컴포넌트 목록.
- **가운데**: 위쪽에 큰 `preview-frame` 하나(선택한 칸의 종류와 크기. 실제로 마우스를 올리거나 누르면 상태가 바뀐다), 아래쪽에 종류별로 크기(줄) × 상태(칸)를 펼친 격자. 각 칸은 작은 `preview-frame`과 `preview-frame-caption`. 종류와 크기는 컴포넌트 이름 줄 오른쪽의 "종류 추가", "크기 추가" 버튼(`button-ghost`, 사이 4px)으로 추가한다. 크기는 모든 종류가 함께 쓰는 것이라 종류마다 두지 않고 한 곳에 둔다.
- **선택**: 칸을 누르면 `selection-outline`이 붙는다. Shift를 누른 채 누르면 여러 칸이 선택되고, 색과 크기 값은 선택한 칸 모두에 적용된다.
- **오른쪽**: 구역은 피그마의 순서를 따른다. 배치(좌우·위아래 여백, 아이콘과 글자 사이), 모양(모서리), 채우기(바탕색), 테두리(테두리색, 굵기), 글자(글자색, 글꼴, 굵기, 크기, 미리보기 글자), 아이콘(위치는 `segmented-option`, Lucide에서 영문 검색). 이 구역들의 위와 아래는 값 패널들과 같은 차례다. 맨 위에 "이름" 구역이 있어 컴포넌트의 이름을 고치고, 칸 하나를 골랐으면 그 칸의 종류와 크기의 이름도 여기서 고친다. 모양 구역들 아래에는 접히는 "코드" 구역(저장 위치, CSS 복사)이 있고, 맨 아래에 복제와 삭제(종류 복제·삭제, 크기 복제·삭제, 컴포넌트 삭제)를 모은다. 전에는 이름과 저장 위치가 맨 아래에 있었는데, 다른 패널은 이름이 맨 위고 저장 위치가 "코드"에 있어서 그것에 맞췄다. 색은 선택한 상태에, 여백과 글자 크기는 선택한 크기에, 나머지는 컴포넌트 전체에 적용된다. 칸을 선택하지 않으면 컴포넌트 전체에 적용되는 값만 보인다. 종류와 크기에는 "복제"가, 컴포넌트에는 "CSS 복사"가 있다. CSS는 `.이름`, `.이름--크기`, `.이름--종류`(`:hover`, `:active`, `:disabled`) 규칙으로 만들어지고 값은 모두 `var(--변수)`를 가리킨다.

### 빠른 실행, 단축키 목록, 알림
- **빠른 실행** (Ctrl+K, Ctrl+/도 같음): 화면 위쪽 가운데에 뜨는 480px 창. 입력칸 하나와 그 아래 목록(화면, 명령, 값의 차례. 컴포넌트는 화면에 든다)으로 이루어진다. 글자를 적으면 이름, 값, 변수 이름으로 걸러지고 ↑↓로 고르고 Enter로 실행한다. 값을 고르면 그 값이 선택되고 화면 가운데로 온다. 고른 줄의 바탕은 `{colors.hover}`이다.
- **단축키 목록** (Ctrl+Shift+/): 720px 확인 창에 편집, 선택, 판, 보기, 숫자 칸으로 나눠 보여 준다. 키는 `{colors.hover}` 바탕의 12px 이름표로 적는다.
- **알림**: 복사처럼 화면에 흔적이 남지 않는 동작은 화면 아래 가운데에 검정 바탕 흰 글자의 32px 알림이 2초 동안 뜬다.

### 화면 구조 짜기
- **왼쪽**: 구조 목록(`tree-row`)과 "블록 넣기". 줄을 마우스로 끌어 순서와 깊이를 바꾼다.
- **가운데**: 쌓은 블록이 실제 컴포넌트로 그려진 `preview-frame`. 블록을 누르면 `selection-outline`이 둘러진다. 맨 아래에 `block-dropzone`.
- **오른쪽**: 선택한 블록의 설정(방향, 칸 수, 사이 간격)과 삭제.
- **화면 버튼**: PC/모바일 폭 전환(`segmented-option`), 코드 보기.

### 아이콘·이미지
- **가운데**: 아이콘과 이미지의 격자. 각 칸 아래에 파일 이름.
- **오른쪽**: 선택한 파일의 미리보기, 크기, 파일 경로, 이름 복사.

## Do's and Don'ts

### Do
- 도구의 색은 검정, 흰색, 회색, 선택 파랑으로만 구성한다.
- 한 화면에 `button-primary`는 하나만 두고 나머지는 `button-secondary`나 `button-ghost`로 한다.
- 면을 나눌 때는 1px `{colors.hairline}` 선이나 `{colors.workspace}` 바탕을 쓴다.
- 메뉴 줄, 입력칸, 버튼의 높이를 32px로 맞춘다.
- 마우스를 올리면 바탕이 생기는 버튼을 나란히 놓을 때는 사이에 4px 이상 간격을 둔다. 호버 바탕끼리 붙거나 겹쳐 보이면 안 된다.
- 모든 화면에 `empty-state`를 만든다.
- 값 이름, 색 코드, 파일 경로는 `{typography.code}`로 표시한다.
- 버튼 글자는 동사로 짧게 쓴다("색 추가", "내보내기").

### Don't
- 오른쪽 패널에 삭제 버튼을 두지 않는다. 값과 사진은 Delete나 Backspace로 지운다. 단축키가 없는 컴포넌트의 종류·크기·컴포넌트 삭제만 패널에 남긴다.
- 삭제할 때 확인 창을 띄우지 않는다. 값, 종류, 크기, 컴포넌트, 사진 모두 바로 지우고 되돌리기(Ctrl+Z)로 살린다. 예외는 하나로, 컴포넌트가 쓰고 있거나 의미 색·의미 글꼴이 가리키는 값을 지울 때는 어디에서 쓰는지 알리는 확인 창을 띄운다.
- 쓰는 법을 설명하는 안내 문구를 넣지 않는다. 입력칸 아래의 도움말("primary처럼 지어요"), 빈 상태의 설명 문장, 패널의 조작 안내가 모두 해당한다. 이름표, 예시 글자(placeholder), 오류, 지금 상태를 알리는 말만 쓴다.
- 도구의 틀에 사용자 디자인 시스템의 색이나 글꼴을 쓰지 않는다. 사용자의 값은 `preview-frame` 안에서만 보인다.
- `{colors.selection}` 파랑을 버튼 바탕, 메뉴 선택, 장식에 쓰지 않는다.
- 패널과 카드에 그림자를 넣지 않는다.
- 파스텔 색 면, 그러데이션, 알약 모양 버튼을 쓰지 않는다.
- 16, 14, 12px 외의 글자 크기를 만들지 않는다.
- 꺼진 버튼의 투명도를 숫자로 따로 적지 않는다(`disabled:opacity-40`). `disabled:opacity-disabled`를 쓴다.
- 화면 코드에 글자 크기, 굵기, 글꼴을 따로 적지 않는다(`text-sm font-[550]`). 의미 글꼴 클래스(`type-label`) 하나를 붙인다.
- `{colors.ink-faint}`보다 옅은 글자색을 쓰지 않는다(작은 숫자 칸의 placeholder만 예외).
- 저장 버튼을 만들지 않는다. 값은 고치는 즉시 저장된다.

## Known Gaps

- **글의 간격**: 화면 예시처럼 글이 이어지는 자리(문단 사이, 제목 위)에 맞는 의미 간격이 없다. FF 화면에는 그런 자리가 없어서 이름을 두지 않았고, 그림에서는 `blocks`·`settings`·`groups`를 빌려 썼다. 글이 많은 화면을 만드는 시스템에는 글의 간격 이름이 따로 필요하다.
- **값이 섞여 있던 관계**: 같은 관계인데 값이 달랐던 곳(패널 안의 위아래 칸 사이 8과 12, 격자의 칸 사이 8·12·16 등)은 값을 바꾸지 않고 값에 맞는 이름을 붙였다. 하나로 맞출지는 정하지 않았다.
- **어두운 테마**: 첫 버전은 밝은 테마만 지원한다.
- **꺼짐 말고 옅게 쓰는 곳**: 끄는 중인 줄(40%), 꺼 둔 후보(40%), 견본의 옅은 글자(20~70%)는 `opacity-숫자`로 적혀 있다. 꺼진 버튼이 아니라서 `opacity-disabled`로 바꾸지 않았고, 이름을 붙이지도 않았다.
- **예시에서 컴포넌트로 가기**: 의미 색과 의미 글꼴 판의 예시는 지금 그림일 뿐이다. 컴포넌트를 만들고 나면, 예시를 눌렀을 때 그 값을 실제로 쓰는 컴포넌트로 가게 한다("쓰이는 곳"에서 컴포넌트로 가는 것과 같은 길). 예시의 그림도 그때는 실제 컴포넌트로 바꿀 수 있다.
- **프로젝트 목록과 폴더 연결 화면**: 아직 시안이 없어 이 문서에 넣지 않았다.
- **화면 구조의 블록 끌기**: 끌어 옮기는 중의 모습은 판에서 정해져 있다(끄는 것은 40%로 옅어지고 놓일 자리에 `{colors.selection}` 선이 보인다). 화면 구조 화면은 아직 만들지 않아서 블록을 끄는 데에는 적용되지 않았다.
- **검사 도구**: `npx @google/design.md lint DESIGN.md` 검사는 아직 돌려보지 않았다.
