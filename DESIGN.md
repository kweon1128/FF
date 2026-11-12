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
  surface-hover: "#f1f1f1"
  hairline: "#e6e6e6"
  hairline-soft: "#f1f1f1"
  selection: "#0d99ff"
  selection-soft: "#e5f4ff"
  on-selection: "#ffffff"
  semantic-danger: "#c5221f"
  semantic-success: "#1ea64a"
  overlay-scrim: "#000000"

typography:
  title:
    fontFamily: SUIT Variable
    fontSize: 16px
    fontWeight: 650
    lineHeight: 1.40
    letterSpacing: -0.16px
  heading:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 650
    lineHeight: 1.45
    letterSpacing: -0.07px
  body:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-strong:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 550
    lineHeight: 1.50
    letterSpacing: 0
  button:
    fontFamily: SUIT Variable
    fontSize: 14px
    fontWeight: 550
    lineHeight: 1.00
    letterSpacing: 0
  label:
    fontFamily: SUIT Variable
    fontSize: 12px
    fontWeight: 550
    lineHeight: 1.35
    letterSpacing: 0
  caption:
    fontFamily: SUIT Variable
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0
  code:
    fontFamily: ui-monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
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
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px

components:
  top-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    height: 44px
    padding: 0 12px
  panel-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    width: 220px
    padding: 8px
  panel-inspector:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    width: 280px
    padding: 16px
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
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  nav-item-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
  nav-item-selected:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
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
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    height: 32px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 12px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 12px
  button-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  button-icon:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    size: 32px
  button-danger-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.semantic-danger}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  segmented-option:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 28px
    padding: 0 12px
  segmented-option-selected:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 28px
    padding: 0 12px
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
    textColor: "{colors.semantic-danger}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 8px
  token-chip:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.sm}"
    padding: 2px 6px
  color-swatch:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    height: 56px
  preview-frame:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 32px
  preview-frame-caption:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.caption}"
    padding: 4px 0 0
  selection-outline:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.on-selection}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
  block-dropzone:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 40px
  empty-state:
    backgroundColor: "{colors.workspace}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    padding: 32px
  save-status:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.semantic-success}"
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
- SUIT 글꼴 하나, 기본 14px. 크기는 16, 14, 12 세 가지만 쓰고 위계는 굵기(400, 550, 650)로 나눈다.
- 그림자 대신 1px 선: 면의 구분은 `{colors.hairline}` 선과 `{colors.workspace}` 옅은 회색 바탕으로 한다.
- 값 이름과 코드는 고정폭 글꼴 `{typography.code}`로 표시한다.

## Colors

### Brand & Accent
- **Black** ({colors.primary}): 주요 버튼의 바탕. 한 화면에 주요 버튼은 하나만 둔다.
- **White** ({colors.on-primary}): 검정 버튼 위의 글자.
- **Selection Blue** ({colors.selection}): 선택 테두리, 포커스 테두리 전용. 버튼 바탕이나 장식으로 쓰지 않는다.
- **Selection Soft** ({colors.selection-soft}): 화면 구조 목록에서 선택된 줄의 바탕.
- **On Selection** ({colors.on-selection}): 선택 테두리에 붙는 작은 이름표의 글자.

### Surface
- **Canvas** ({colors.canvas}): 왼쪽 메뉴, 오른쪽 편집 패널, 상단 바, 미리보기 틀의 바탕.
- **Workspace** ({colors.workspace}): 가운데 영역의 바탕. 흰 미리보기 틀이 이 위에 놓여 구분된다.
- **Surface Hover** ({colors.surface-hover}): 마우스를 올린 줄, 선택된 메뉴 항목, 값 이름표의 바탕.
- **Hairline** ({colors.hairline}): 패널 사이의 선, 입력칸과 버튼의 테두리.
- **Hairline Soft** ({colors.hairline-soft}): 패널 안에서 묶음을 나누는 더 옅은 선.

### Text
- **Ink** ({colors.ink}): 제목, 본문, 입력한 값.
- **Ink Soft** ({colors.ink-soft}): 선택되지 않은 메뉴 항목, 보조 설명.
- **Ink Faint** ({colors.ink-faint}): 묶음 이름, 입력칸 이름, 안내 문구. 흰 바탕에서 읽을 수 있는 가장 옅은 회색이며 이보다 옅은 글자는 쓰지 않는다.

### Semantic
- **Danger** ({colors.semantic-danger}): 삭제 버튼의 글자, 잘못된 입력의 테두리와 안내.
- **Success** ({colors.semantic-success}): "저장됨" 표시.
- **Overlay Scrim** ({colors.overlay-scrim}): 확인 창 뒤를 덮는 검정. 40% 투명도로 쓴다.

## Typography

### Font Family
- **SUIT Variable**: 한글과 영문이 함께 들어 있는 무료 가변 글꼴. 글꼴 파일을 FF 안에 넣어 인터넷 없이도 같은 모양으로 보이게 한다. 대체 순서는 `SUIT Variable, SUIT, Pretendard, system-ui, sans-serif`.
- **고정폭**: `ui-monospace, Consolas, monospace`. 값 이름(`--color-primary-400`), 색 코드, 파일 경로에만 쓴다.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.title}` | 16px | 650 | 1.40 | 가운데 영역의 화면 제목 |
| `{typography.heading}` | 14px | 650 | 1.45 | 편집 패널에서 선택한 항목의 이름, 묶음 제목 |
| `{typography.body}` | 14px | 400 | 1.50 | 기본 글자, 메뉴 항목, 입력값 |
| `{typography.body-strong}` | 14px | 550 | 1.50 | 선택된 메뉴 항목, 강조할 본문 |
| `{typography.button}` | 14px | 550 | 1.00 | 모든 버튼 |
| `{typography.label}` | 12px | 550 | 1.35 | 메뉴 묶음 이름, 입력칸 이름 |
| `{typography.caption}` | 12px | 400 | 1.35 | 미리보기 아래 설명, 저장 상태 |
| `{typography.code}` | 12px | 400 | 1.35 | 값 이름, 색 코드, 파일 경로 |

### Principles
- **크기는 세 가지뿐이다.** 16, 14, 12px 외의 크기를 새로 만들지 않는다.
- **위계는 굵기로 나눈다.** 같은 14px에서 400은 본문, 550은 선택과 버튼, 650은 제목이다.
- **영문 대문자 표기를 쓰지 않는다.** 묶음 이름도 한글 그대로 쓴다.
- **고정폭은 코드에만 쓴다.** 설명 문장에는 쓰지 않는다.

## Layout

### Spacing System
- **기준 단위**: 4px.
- **값**: `{spacing.hair}` 1px, `{spacing.xxs}` 2px, `{spacing.xs}` 4px, `{spacing.sm}` 8px, `{spacing.md}` 12px, `{spacing.lg}` 16px, `{spacing.xl}` 24px, `{spacing.xxl}` 32px.
- 메뉴 줄과 입력칸, 버튼의 높이는 모두 32px로 통일한다.
- 편집 패널 안에서 입력칸 사이는 `{spacing.md}`, 묶음 사이는 `{spacing.xl}`.
- 가운데 영역의 안쪽 여백은 `{spacing.xl}`.

### Grid & Container
화면 전체를 채우는 3단 구성이며 페이지 전체가 스크롤되지 않는다. 각 단이 따로 스크롤된다.

| 영역 | 너비 | 역할 |
|---|---|---|
| 상단 바 | 전체, 높이 44px | 프로젝트 선택, 저장 상태 |
| 왼쪽 메뉴 | 220px 고정 | 화면 이동, 항목 목록 |
| 가운데 | 남는 너비 전부 | 미리보기 |
| 오른쪽 편집 패널 | 280px 고정 | 선택한 항목의 값 편집 |

- 창 너비가 1100px보다 좁아지면 오른쪽 편집 패널을 접을 수 있다. 그보다 좁은 화면(모바일)은 지원하지 않는다.
- 아무것도 선택하지 않았을 때 오른쪽 패널은 사라지고 가운데 영역이 그만큼 넓어진다. 항목을 선택하면 다시 나타난다. 조작법을 설명하는 안내 문구는 패널에 넣지 않는다.

### Whitespace Philosophy
여백은 가운데 미리보기에 몰아준다. 좌우 패널은 촘촘하게, 가운데는 넉넉하게 두어 눈이 자연스럽게 사용자의 디자인으로 가게 한다.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (평면) | 선도 그림자도 없음 | 가운데 바탕, 메뉴 줄 |
| 1 (선) | 1px `{colors.hairline}` | 패널 경계, 입력칸, 버튼, 미리보기 틀 |
| 2 (떠 있음) | 0 4px 16px rgba(0,0,0,0.08) + 1px 선 | 드롭다운 목록, 색 선택 창 |
| 3 (확인 창) | 0 8px 32px rgba(0,0,0,0.12) + `{colors.overlay-scrim}` 40% | 삭제 확인 같은 창 |

그림자는 "화면 위에 잠깐 떠 있는 것"에만 쓴다. 패널과 카드에는 쓰지 않는다.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 2px | 선택 테두리, 이름표 |
| `{rounded.sm}` | 4px | 값 이름표, 전환 버튼의 각 칸 |
| `{rounded.md}` | 6px | 버튼, 입력칸, 메뉴 줄, 색 견본 |
| `{rounded.lg}` | 8px | 미리보기 틀, 드롭다운, 확인 창 |
| `{rounded.full}` | 9999px | 상태 점 |

알약 모양 버튼은 쓰지 않는다. 아이콘은 Lucide 한 종류만 16px 크기, 선 굵기 1.5px로 쓴다.

## Components

### 틀
**`top-bar`**: 높이 44px, 아래쪽에 `{colors.hairline}` 선. 왼쪽에 프로젝트 이름과 전환 메뉴, 오른쪽에 `save-status`.

**`panel-nav`**: 너비 220px, 오른쪽에 `{colors.hairline}` 선. 위에서부터 묶음 이름(`nav-section-label`)과 항목(`nav-item`)이 반복된다.

**`panel-inspector`**: 너비 280px, 왼쪽에 `{colors.hairline}` 선. 구역으로 나뉘며, 구역 사이에만 패널 전체 폭의 1px `{colors.hairline}` 구분선을 둔다. 구역 안에는 구분선을 넣지 않는다. 각 구역은 안쪽 여백이 위아래 12px, 좌우 16px이다. 글자 크기는 역할별로 두 가지만 쓴다. 읽고 고치는 내용(맨 위 항목 이름 14px 굵기 650, 입력칸 14px, 삭제 14px)은 14px이고, 그것을 설명하는 것(구역 제목 12px 굵기 650, 입력칸 이름표 12px `{colors.ink-faint}`, 코드 표시 12px 고정폭)은 12px이다. 입력칸은 종류와 관계없이 모두 같은 글꼴과 크기를 쓴다. 구역의 순서는 항목 이름, 이름, 값, 코드, 삭제다.

**`workspace`**: 바탕 `{colors.workspace}`. 맨 위에 화면 제목(`{typography.title}`)과 화면별 버튼, 그 아래에 `preview-frame`.

### 메뉴와 목록
**`nav-item`**: 높이 32px, 아이콘 16px과 글자. 기본은 `{colors.ink-soft}`. 항목 사이에 2px 간격을 두어 마우스를 올린 바탕끼리 붙어 보이지 않게 한다.
- 마우스를 올리면 `nav-item-hover`: 바탕 `{colors.surface-hover}`, 글자 `{colors.ink}`.
- 현재 화면이면 `nav-item-selected`: 바탕 `{colors.surface-hover}`, 글자 `{colors.ink}`, 굵기 550. 파랑을 쓰지 않는다.

**`tree-row`**: 화면 구조 목록의 한 줄. 깊이마다 왼쪽 여백을 16px씩 더한다.
- 선택되면 `tree-row-selected`: 바탕 `{colors.selection-soft}`. 가운데 미리보기의 파란 테두리와 같은 항목임을 색으로 잇는다.

### 버튼
**`button-primary`**: 검정 바탕, 흰 글자, 높이 32px. 한 화면에 하나만 둔다(예: "내보내기").

**`button-secondary`**: 흰 바탕, 1px `{colors.hairline}` 테두리. 기본 버튼이며 대부분의 동작에 쓴다(예: "색 추가").

**`button-ghost`**: 테두리 없음. 마우스를 올리면 바탕이 `{colors.surface-hover}`가 된다. 패널 안의 작은 동작에 쓴다.

**`button-icon`**: 32px 정사각형, 아이콘만. 반드시 마우스를 올리면 나오는 설명을 붙인다.

**`button-danger-ghost`**: 삭제 전용. 글자만 `{colors.semantic-danger}`.

**`segmented-option`** + **`segmented-option-selected`**: 둘 중 하나를 고르는 전환 버튼(예: 가로/세로, PC/모바일). 전체 바탕은 `{colors.surface-hover}`, 선택된 칸만 흰 바탕과 1px 선.

### 입력칸
**`field-label`**: 입력칸 위의 이름, 12px.

**`field-input`**: 높이 32px, 1px `{colors.hairline}` 테두리. 숫자, 글자, 드롭다운이 모두 같은 모양이다.
- `field-input-focused`: 테두리가 `{colors.selection}`으로 바뀐다. 바탕은 그대로다.
- `field-input-error`: 테두리가 `{colors.semantic-danger}`로 바뀌고, 아래에 12px 안내 문구가 붙는다.
- 색 입력칸은 왼쪽에 20px 색 견본을 붙이고, 누르면 색 선택 창이 열린다.

**`token-chip`**: 값 이름을 보여주는 작은 이름표(예: `primary-400`). 고정폭 글꼴, 바탕 `{colors.surface-hover}`.

### 미리보기
**`color-swatch`**: 높이 56px의 색 면과 그 아래 이름. 색 면에는 1px `{colors.hairline}` 테두리를 둘러 흰색에 가까운 색도 보이게 한다.

**`preview-frame`**: 사용자의 실제 컴포넌트가 놓이는 흰 틀. 안쪽 여백 32px, 1px 선. **이 틀 안에는 이 문서의 규칙이 적용되지 않는다.** 틀 안은 사용자의 디자인 시스템 값만 따른다.

**`preview-frame-caption`**: 틀 아래의 상태 이름(예: "마우스 올림").

**`selection-outline`**: 선택한 항목을 두르는 1px `{colors.selection}` 선. 항목의 가장자리에 틈 없이 딱 붙인다. 피그마처럼 항목의 모서리가 둥글어도 선은 항상 각진 사각형이다(호버 선도 같다). 네 꼭짓점에는 7px 흰 사각형(1px `{colors.selection}` 테두리)을 둔다. 항목 바로 아래 가운데에 "이름 · 값"을 담은 작은 파란 이름표가 붙는다(예: `primary-500 · #888888`). 이름표는 주변에 무엇이 있든 가장 위에 겹쳐 보인다. 항목 아래에 이름과 값이 따로 적혀 있어도(색 견본, 컴포넌트 칸) 그 글자를 숨기지 않고 그대로 둔 채 이름표를 위에 겹친다. 항목과 떨어진 선은 쓰지 않는다.

**`hover-outline`**: 선택할 수 있는 항목에 마우스를 올리면 같은 자리에 2px `{colors.selection}` 선만 나타난다. 꼭짓점 사각형과 이름표는 없고 바탕색도 바꾸지 않는다. 피그마와 같이, 호버는 두꺼운 선으로, 선택은 얇은 선에 꼭짓점과 이름표로 구분한다. 이미 선택된 항목에 마우스를 올리면 꼭짓점과 이름표는 그대로 두고 선만 2px로 두꺼워진다.

**`add-tile`**: 항목을 추가하는 상자. 목록의 맨 끝에 항목과 같은 크기로 놓이며, 1px 점선 `{colors.hairline}` 테두리 안에 + 아이콘만 둔다. 마우스를 올리면 점선이 사라지고 바탕이 `{colors.surface-hover}`가 된다. "추가"라는 글자 버튼 대신 이것을 쓴다. 글자 버튼은 "목록 추가"처럼 묶음 자체를 만들 때만 쓴다.

**`block-dropzone`**: 화면 구조에서 "블록 넣기" 자리. 1px 점선 `{colors.hairline}`, 높이 40px.

### 상태
**`empty-state`**: 아직 아무것도 없을 때. 제목 한 줄, 설명 한 줄, 버튼 하나(예: "첫 색을 추가해 보세요" / "색 추가"). FF는 빈 상태에서 시작하므로 모든 화면에 반드시 있어야 한다.

**`save-status`**: 상단 바 오른쪽의 "저장됨" 또는 "저장 중…" 표시. 값은 고치는 즉시 파일에 저장되므로 저장 버튼은 두지 않는다.

## Screens

모든 화면은 같은 3단 틀을 쓰고, 세 영역의 내용만 바뀐다.

### 왼쪽 메뉴 (공통)
- **전체 보기** (맨 위, 도구를 열면 처음 보이는 화면)
- **기본 값**: 색상, 글꼴, 간격, 모서리, 테두리, 효과, 화면 크기, 움직임
- **만들기**: 컴포넌트, 화면 구조, 아이콘·이미지. 컴포넌트 화면에서는 메뉴 항목 바로 아래에 컴포넌트 목록과 "컴포넌트 추가"가 펼쳐진다.

### 전체 보기
모든 기본 값을 한 판에 펼쳐 놓고 자유롭게 이동하며 보는 넓은 화면이다. 가운데 영역 전체가 캔버스이며 안쪽 여백이 없다.
- **판**: 기본 값 화면 하나가 각각 하나의 흰 판(너비는 기본 560px이고 판마다 바꿀 수 있다, 1px 선, 모서리 8px)이다. 판 왼쪽 위 바깥에 12px `{colors.ink-faint}` 제목이 붙는다.
- **조작**: 휠은 위아래 이동, Shift+휠은 좌우 이동, Ctrl+휠은 마우스 위치 기준 확대·축소(휠 한 칸에 약 15%), 스페이스를 누른 채 끌면 화면 이동.
- **영역 선택**: 스페이스 없이 끌면 1px `{colors.selection}` 선과 옅은 파랑(10%) 면의 사각형이 그려지고, 끄는 동안 바로 선택된다. 항목은 영역에 걸치면, 판은 영역 안에 통째로 들어오면 선택된다. Shift를 누른 채 끌면 지금 선택에 더한다.
- **판 선택**: 판 제목을 누르면 그 판이 선택되고 Shift로 여러 개를 고른다. 선택된 판은 1px `{colors.selection}` 선과 꼭짓점 사각형이 붙고 제목이 파랑이 된다. 선택한 판 중 하나의 제목을 끌면 모두 함께 이동한다.
- **판 선택(누르기)**: 판 제목이나 판 안의 여백을 누르기만 해도 그 판이 선택된다. 제목이나 여백을 잡고 끌면 판이 움직인다. 제목 위에서 마우스 커서는 바뀌지 않는다.
- **판 호버**: 판에 마우스를 올리면 `hover-outline`과 같은 2px `{colors.selection}` 선이 나타난다. 판 안의 항목 위에서는 항목의 선만 보인다.
- **판 편집 패널**: 판을 선택하면 오른쪽에 피그마와 같은 구역이 나온다. **위치**에는 정렬 버튼 6개(`button-icon`, 2개 이상 선택했을 때만 쓸 수 있다)와 X·Y, **배치**에는 크기(W는 240~1600 사이로 고칠 수 있고 H는 내용에 따라 정해져 보여 주기만 한다)와 가로·세로 간격(2개 이상일 때)이 있다. 그 아래로 **모양**(투명도 0~100%, 모서리), **채우기**(색), **테두리**(색, 굵기 0~20)가 이어진다. 이 값들은 판마다 `ff.canvas.json`에 저장되고, 고치지 않은 판은 기본 모양(흰 바탕, 1px `{colors.hairline}` 선, 모서리 8px)을 따른다. 판의 투명도를 낮춰도 선택 표시는 흐려지지 않는다. 색 칸은 왼쪽 견본을 누르면 색 선택 창이 열리고 오른쪽에 #rrggbb를 적는다. 숫자 칸은 앞에 짧은 이름표가 붙고, 값이 서로 다르면 "서로 다름"을 보여 준다. 칸을 벗어나거나 Enter를 누르면 반영한다.
- **단축키**: 키는 피그마와 같다. 입력칸에 글자를 쓰는 중이거나 확인 창이 떠 있으면 동작하지 않는다.

| 키 | 동작 |
|---|---|
| Alt+A / D / W / S | 선택한 판을 왼쪽 / 오른쪽 / 위 / 아래로 정렬 (판 2개 이상) |
| Alt+H / V | 가로 / 세로 가운데 정렬 |
| Alt+Shift+H / V (Ctrl+Alt+H / V도 같음) | 가로 / 세로 간격을 고르게 (판 3개 이상). 양 끝의 판은 그대로 두고 사이를 나눈다. |
| 방향키, Shift+방향키 | 선택한 판을 1px / 10px 이동 |
| Ctrl+A | 모두 선택 (기본 값 화면에서는 그 화면의 값, 컴포넌트 화면에서는 모든 칸) |
| Esc | 선택 풀기 |
| Ctrl+Z / Ctrl+Shift+Z (또는 Ctrl+Y) | 되돌리기 / 다시 실행. 값, 컴포넌트, 판 위치의 변경을 100단계까지 기억하고 파일에도 반영한다. 0.5초 안에 이어진 변경은 한 번으로 묶는다. 디자인 시스템을 바꾸거나 새로 고치면 기록이 비워진다. |
| Delete, Backspace | 선택한 값 삭제 (확인 창을 거친다) |
| Ctrl+C / Ctrl+V | 선택한 값을 복사 / 붙여넣기. 클립보드에는 CSS 변수 선언(`--color-primary-500: #3b82f6;`) 그대로 담겨서 다른 디자인 시스템이나 코드에도 붙일 수 있다. 붙인 값은 같은 종류의 맨 끝에 들어가고, 이름이 겹치면 copy가 붙는다. 색 값을 선택해 둔 채 붙이면 그 색이 속한 목록으로 들어간다. |
| Ctrl+D | 복제. 선택한 값 바로 뒤에 같은 값을 하나 더 만든다(이름 뒤에 copy). 컴포넌트 화면에서는 선택한 칸의 종류를 복제한다. |
| Ctrl+R, 더블클릭 | 그 자리에서 이름 바꾸기. 이름 위에 입력칸이 겹쳐 뜨고 Enter나 바깥 누르기로 반영, Esc로 취소한다. 값을 하나만 선택했을 때 동작한다(그 밖에는 브라우저의 새로 고침). 컴포넌트 화면에서는 종류와 크기의 이름을 고친다. |
| Ctrl+] / Ctrl+[ | 선택한 값을 같은 묶음(같은 종류, 색은 같은 목록) 안에서 한 칸 뒤 / 앞으로 옮긴다 |
| Tab / Shift+Tab | 선택을 다음 / 이전 항목으로 옮긴다 (무언가 선택되어 있을 때) |
| I | 스포이드. 화면에서 찍은 색을 선택한 색 값에 넣는다. 색 값이 없고 판을 선택했으면 판의 채우기에 넣는다. 크롬 계열 브라우저에서만 된다. |
| 1 ~ 9, 0 | 선택한 판의 투명도를 10 ~ 90%, 100%로 |
| Ctrl+Shift+L / Ctrl+Shift+H | 선택한 판을 잠그기·풀기 / 숨기기 |
| Shift+끌기 / Ctrl+끌기 | 판을 가로나 세로로만 이동 / 다른 판에 붙지 않고 이동 |
| Alt+마우스 올림 | 선택한 판들과 마우스를 올린 판 사이의 거리를 숫자로 보여 준다 |
| Ctrl+K (Ctrl+/도 같음) | 빠른 실행 |
| Ctrl+Shift+? | 단축키 목록 |
| Ctrl+\ | 상단 바, 왼쪽 메뉴, 오른쪽 패널을 숨기고 가운데만 보기. 다시 누르면 돌아온다. |
| Shift+1 / Shift+2 | 전체 / 선택한 것이 보이게 화면 맞춤 |
| Ctrl+0, +, - | 100%, 확대, 축소 |

- **붙기와 안내선**: 판을 끌 때 다른 판의 왼쪽·가운데·오른쪽(위·가운데·아래)에 화면 기준 6px 안으로 가까워지면 그 자리에 붙고, 맞은 자리에 1px `{colors.semantic-danger}` 선이 그어진다. 거리 재기의 선과 숫자 이름표도 같은 빨강이다. 선택의 파랑과 헷갈리지 않게 하려는 것으로, 도구의 틀에서 빨강을 삭제 외에 쓰는 유일한 곳이다.
- **잠금과 숨기기**: 잠근 판은 선택은 되지만 끌기, 방향키, 정렬, 영역 선택으로 움직이지 않고 제목 옆에 자물쇠가 붙는다. 숨긴 판은 캔버스에서 사라진다. 둘 다 왼쪽 메뉴의 그 줄 오른쪽에 아이콘이 생기고, 누르면 풀리거나 다시 보인다. 숨긴 판의 메뉴를 눌러도 다시 보인다. 판 편집 패널의 제목 줄에도 잠그기·숨기기 버튼이 있다. 상태는 `ff.canvas.json`에 저장한다.
- **숫자 칸**: 숫자 칸에서 ↑↓를 누르면 1씩, Shift와 함께면 10씩 바뀐다. 칸 앞의 이름표(X, W 등)를 좌우로 끌면 끈 만큼 값이 바뀐다(Shift는 10배). 기본 값의 값 입력칸도 `16px`, `1.5`처럼 숫자 하나로 된 값이면 ↑↓로 바뀐다(소수는 0.1씩).
- **저장**: 판의 위치는 디자인 시스템 폴더의 `ff.canvas.json`에 저장한다. 보는 위치와 확대 비율은 브라우저에만 기억한다.
- **편집**: 판 안의 항목을 누르면 선택되고 오른쪽 패널에서 고친다. 추가도 판 안에서 한다. 빈 곳을 누르면 선택이 풀린다.
- **선 굵기 유지**: 선택과 호버의 선, 꼭짓점 사각형, 이름표, 판 제목은 확대 비율과 관계없이 화면에서 같은 크기(1px, 2px, 7px)로 보인다. 축소해도 가늘어지지 않는다.
- **확대 표시**: 오른쪽 아래에 축소, 비율(누르면 100%), 확대 버튼을 둔다. 캔버스 위에 떠 있으므로 2단계 그림자를 쓴다.

### 기본 값 화면
기본 값 화면은 따로 있는 화면이 아니라 전체 보기의 한 부분이다. 왼쪽 메뉴에서 색상·글꼴 등을 누르면 같은 캔버스에서 그 판이 화면에 맞게 보이도록 0.3초 동안 부드럽게 이동한다(100%까지만 확대). 옆의 판도 그대로 보이고, 이동·확대·선택·단축키는 전체 보기와 같다. "전체 보기"를 누르면 모든 판이 보이게 맞춘다. 처음 열 때는 지난번에 보던 위치를 그대로 둔다.

화면과 그 안의 종류는 다음과 같다. 변수 이름의 앞부분은 Tailwind v4 규칙을 따른다.

| 화면 | 종류 |
|---|---|
| 색상 | 색(`--color-`) |
| 글꼴 | 글꼴 종류(`--font-`), 글자 크기(`--text-`), 굵기(`--font-weight-`), 줄 높이(`--leading-`), 글자 사이(`--tracking-`) |
| 간격 | 간격(`--spacing-`) |
| 모서리 | 모서리(`--radius-`) |
| 테두리 | 테두리 굵기(`--border-width-`) |
| 효과 | 그림자(`--shadow-`), 투명도(`--opacity-`), 흐림(`--blur-`) |
| 화면 크기 | 화면 폭 기준(`--breakpoint-`), 최대 너비(`--container-`), 비율(`--aspect-`), 겹치는 순서(`--z-`) |
| 움직임 | 움직임 시간(`--duration-`), 움직임 흐름(`--ease-`) |

- **여러 개 선택**: Shift(또는 Ctrl)를 누른 채 누르면 선택에 더하거나 뺀다. 여러 개를 선택하면 이름표와 꼭짓점 없이 1px 선만 두르고, 오른쪽 패널은 개수, 선택한 이름들, (같은 종류일 때) 값 한 번에 바꾸기, 삭제를 보여준다.
- **가운데**: 색상은 목록별 `color-swatch` 격자, 글꼴은 실제 크기로 쓴 예시 문장, 간격은 길이에 맞는 막대, 모서리는 둥글기가 적용된 사각형.
- **색 목록**: 색은 목록(예: primary, gray)에 속한다. 화면 위의 "목록 추가"로 목록을 만들고, 각 목록 끝의 `add-tile`로 그 목록에 색을 추가한다. 새 색의 이름은 100, 200처럼 앞의 단계를 이어 간다. 목록에 속하지 않은 색은 "단독 색"으로 모인다.
- **추가**: 글꼴, 간격, 모서리는 목록 끝의 `add-tile`로 추가한다.
- **오른쪽**: 선택한 값의 이름(색은 목록과 이름 두 칸), 값 입력칸(색은 오른쪽에 스포이드 버튼), 변수 이름(`token-chip`)과 `var(--이름)`을 복사하는 버튼, 저장되는 파일, **쓰이는 곳**, 삭제. 쓰이는 곳은 이 값을 쓰는 컴포넌트와 그 자리(예: primary · 기본 · 바탕색)를 보여 주고, 컴포넌트 이름을 누르면 그 컴포넌트로 이동한다. 컴포넌트에서 쓰는 값을 지우려 하면 확인 창이 그 사실을 알려 준다.

### 컴포넌트 화면
컴포넌트는 FF 안에서 빈 상자부터 만든다. 구조는 상자 하나에 아이콘과 글자이며, 설정은 디자인 시스템 폴더의 `components.json`에 저장한다.
- **값**: 모든 속성은 기본 값 중에서만 고른다. 직접 적는 값은 받지 않는다. 고른 값이 없어지면 그 칸에 안내를 띄운다.
- **종류와 크기**: 종류(예: primary)는 상태별 바탕색·글자색·테두리색을, 크기(예: md)는 좌우·위아래 여백, 글자 크기, 아이콘과 글자 사이를 맡는다. 글꼴, 굵기, 모서리, 테두리 굵기, 아이콘은 컴포넌트 공통이다.
- **상태**: 기본, 마우스 올림, 누름, 비활성. 기본이 아닌 상태에서 비운 색은 기본 상태의 색을 따른다.
- **왼쪽**: 메뉴 아래에 컴포넌트 목록.
- **가운데**: 위쪽에 큰 `preview-frame` 하나(선택한 칸의 종류와 크기. 실제로 마우스를 올리거나 누르면 상태가 바뀐다), 아래쪽에 종류별로 크기(줄) × 상태(칸)를 펼친 격자. 각 칸은 작은 `preview-frame`과 `preview-frame-caption`. 크기와 종류는 `add-tile`로 추가한다.
- **선택**: 칸을 누르면 `selection-outline`이 붙는다. Shift를 누른 채 누르면 여러 칸이 선택되고, 색과 크기 값은 선택한 칸 모두에 적용된다.
- **오른쪽**: 구역은 피그마의 순서를 따른다. 배치(좌우·위아래 여백, 아이콘과 글자 사이), 모양(모서리), 채우기(바탕색), 테두리(테두리색, 굵기), 글자(글자색, 글꼴, 굵기, 크기, 미리보기 글자), 아이콘(위치는 `segmented-option`, Lucide에서 영문 검색). 그 아래에 종류(이름, 삭제), 크기(이름, 삭제), 컴포넌트(이름, 저장 위치, 삭제)를 둔다. 색은 선택한 상태에, 여백과 글자 크기는 선택한 크기에, 나머지는 컴포넌트 전체에 적용된다. 칸을 선택하지 않으면 컴포넌트 전체에 적용되는 값만 보인다. 종류와 크기에는 "복제"가, 컴포넌트에는 "CSS 복사"가 있다. CSS는 `.이름`, `.이름--크기`, `.이름--종류`(`:hover`, `:active`, `:disabled`) 규칙으로 만들어지고 값은 모두 `var(--변수)`를 가리킨다.

### 빠른 실행, 단축키 목록, 알림
- **빠른 실행** (Ctrl+K): 화면 위쪽 가운데에 뜨는 480px 창. 입력칸 하나와 그 아래 목록(화면, 컴포넌트, 값, 명령)으로 이루어진다. 글자를 적으면 이름, 값, 변수 이름으로 걸러지고 ↑↓로 고르고 Enter로 실행한다. 값을 고르면 그 값이 선택되고 화면 가운데로 온다. 고른 줄의 바탕은 `{colors.surface-hover}`이다.
- **단축키 목록** (Ctrl+Shift+?): 720px 확인 창에 편집, 선택, 판, 보기, 숫자 칸으로 나눠 보여 준다. 키는 `{colors.surface-hover}` 바탕의 12px 이름표로 적는다.
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
- 모든 화면에 `empty-state`를 만든다.
- 값 이름, 색 코드, 파일 경로는 `{typography.code}`로 표시한다.
- 버튼 글자는 동사로 짧게 쓴다("색 추가", "내보내기").

### Don't
- 도구의 틀에 사용자 디자인 시스템의 색이나 글꼴을 쓰지 않는다. 사용자의 값은 `preview-frame` 안에서만 보인다.
- `{colors.selection}` 파랑을 버튼 바탕, 메뉴 선택, 장식에 쓰지 않는다.
- 패널과 카드에 그림자를 넣지 않는다.
- 파스텔 색 면, 그러데이션, 알약 모양 버튼을 쓰지 않는다.
- 16, 14, 12px 외의 글자 크기를 만들지 않는다.
- `{colors.ink-faint}`보다 옅은 글자색을 쓰지 않는다.
- 저장 버튼을 만들지 않는다. 값은 고치는 즉시 저장된다.

## Known Gaps

- **어두운 테마**: 첫 버전은 밝은 테마만 지원한다.
- **프로젝트 목록과 폴더 연결 화면**: 아직 시안이 없어 이 문서에 넣지 않았다.
- **끌어 옮기는 중의 모습**: 블록을 끌 때의 표시(놓일 자리 선, 끌리는 줄의 모양)는 아직 정하지 않았다.
- **검사 도구**: `npx @google/design.md lint DESIGN.md` 검사는 아직 돌려보지 않았다.
