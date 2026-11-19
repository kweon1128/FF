import { ICON_STROKE } from './lib/icons'
import { createContext, type CSSProperties, type MouseEvent } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Plus, RotateCcw, Rows3, TriangleAlert } from 'lucide-react'
import type { Token } from './lib/api'
import { groupOf, lineName, shortName, trackName, type Kind } from './lib/catalog'
import { isApprox, showColor } from './lib/color'
import { shownFont } from './lib/fonts'
import { SCALE_STEPS } from './lib/scale'
import { resolveColor, type RoleUse } from './lib/roles'
import { suggestLine } from './lib/tokens'
import { EffectList } from './Effects'
import { RadiusList } from './Radius'
import { BorderList } from './Borders'
import { LayerList } from './Layers'
import { ValueList } from './ValueBoard'
import { specOf } from './valueSpecs'
import { isBorderKind, resolveThickness } from './lib/borders'
import { isEffectKind, shadowRefs } from './lib/effects'
import { isFreeKind, orderKinds } from './lib/order'
import type { SpaceUse } from './lib/spacing'
import { resolveLength, type SizeGroup } from './lib/sizes'
import { resolveCorner, type RadiusGroup } from './lib/radius'
import { useReorder } from './useReorder'
import { SpaceList, resolveSpace } from './Spacing'
import { SizeList } from './Sizes'
import { RoleList } from './Roles'
import { TypeList } from './Types'
import { lookOf, type TypeUse } from './lib/types'
import { Button, swatchBackground } from './ui'

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 Aa 123'

export type SectionProps = {
  tokens: Token[]
  /** 선택한 값의 이름들. Shift를 누른 채 누르면 여러 개가 담긴다. */
  selected: string[]
  /** additive가 참이면 지금 선택에 더하거나 뺀다. */
  onSelect: (name: string, additive: boolean) => void
  /** group은 색에서만 쓴다. ''는 단계 목록에 속하지 않은 예외 색. */
  onAdd: (kind: Kind, group?: string) => void
  onAddGroup: () => void
  /** 항목을 더블클릭하면 그 자리에서 이름을 고친다. */
  onRename: (name: string) => void
  /** 색 목록의 이름을 누르면 그 목록의 색을 모두 선택한다. rename이면 이어서 목록 이름을 고치러 간다. */
  onSelectGroup: (names: string[], additive: boolean, rename: boolean) => void
  /** 색을 모두 지웠지만 남겨 둔 빈 색 목록들. */
  emptyGroups: string[]
  /** 빈 목록은 색이 없어서 목록 자체를 선택한다. 선택한 빈 목록의 이름(없으면 null). Delete로 지운다. */
  pickedGroup: string | null
  onPickGroup: (group: string) => void
  /** 색 목록을 끌어서 다른 자리에 놓는다. before는 그 앞에 놓일 목록(맨 끝이면 null). */
  onReorderGroup: (group: string, before: string | null) => void
  /** 색상 판을 접었는지. 접으면 색 견본 아래의 이름과 값 글자를 모두 숨기고 색만 보여 준다. */
  folded: boolean
  /** 의미 색 판을 접었는지. 접으면 설명과 예시를 숨기고 색과 이름만 보여 준다. */
  rolesFolded: boolean
  /** 의미 색을 끌어서 같은 묶음 안의 다른 자리에 놓는다. before는 그 앞에 놓일 색(묶음의 맨 끝이면 null). */
  onMoveRole: (name: string, before: string | null) => void
  /** 의미 색의 역할 묶음을 끌어서 다른 자리에 놓는다. */
  onMoveRoleGroup: (use: RoleUse, before: RoleUse | null) => void
  /** 의미 글꼴을 끌어서 같은 묶음 안의 다른 자리에 놓는다. before는 그 앞에 놓일 조합(묶음의 맨 끝이면 null). */
  onMoveType: (name: string, before: string | null) => void
  /** 의미 글꼴의 묶음을 끌어서 다른 자리에 놓는다. */
  onMoveTypeGroup: (use: TypeUse, before: TypeUse | null) => void
  /** 손으로 차례를 바꾸는 종류(효과, 글꼴 종류, 비율, 흐름)에서 값을 끌어 다른 자리에 놓는다. before는 그 앞에 놓일 값(맨 끝이면 null). */
  onMoveInKind: (kind: Kind, name: string, before: string | null) => void
  /** 판 안의 종류(글꼴 종류, 글자 크기…)를 끌어 다른 자리에 놓는다. kinds는 그 판의 종류들, before는 그 앞에 놓일 종류(맨 끝이면 null). */
  onMoveKind: (kinds: Kind[], kind: Kind, before: Kind | null) => void
  /** 의미 간격의 묶음을 끌어 다른 자리에 놓는다. */
  onMoveSpaceGroup: (use: SpaceUse, before: SpaceUse | null) => void
  /** 의미 크기의 묶음을 끌어 같은 종류(높이, 폭, 정사각형) 안의 다른 자리에 놓는다. */
  onMoveSizeGroup: (kind: Kind, group: SizeGroup, before: SizeGroup | null) => void
  /** 의미 모서리의 묶음을 끌어 다른 자리에 놓는다. */
  onMoveRadiusGroup: (group: RadiusGroup, before: RadiusGroup | null) => void
  /** 그 종류를 기본 순서로 돌려놓는 일. 이미 기본 순서면 undefined(버튼이 꺼진다). */
  resetOf: (kind: Kind) => (() => void) | undefined
  /** 의미 글꼴 판의 묶음과 조합을 기본 순서로 돌려놓는다. 이미 기본 순서면 없다. */
  onResetTypes?: () => void
  /** 이 판을 접었는지. 접으면 설명과 예시를 숨기고 이름과 값만 보여 준다(의미 글꼴, 의미 간격, 효과, 의미 모서리, 의미 테두리 판). */
  detailsFolded?: boolean
  /** 접기를 바꾼다. 주면 종류가 하나뿐인 판의 제목 줄에 접기 버튼이 나온다(종류가 여럿인 판은 판 위에 따로 둔다). */
  onToggleDetails?: () => void
  /** 글자 크기 한 벌을 만드는 창을 연다. */
  onMakeSizes?: () => void
  /** 굵기 한 벌을 만드는 창을 연다. */
  onMakeWeights?: () => void
  /** 의미 글꼴 한 벌을 만드는 창을 연다. */
  onMakeTypes?: () => void
}

/** 판을 접었는지(설명과 예시를 숨기는지). 판 안의 목록들이 읽는다. 의미 글꼴, 의미 간격, 효과, 의미 모서리 판에서 쓴다. */
export const DetailsFolded = createContext(false)

/** 판 안에 묶음 제목이 따로 있는 종류. 그 종류 하나로 된 판에서는 종류의 제목을 두지 않는다. */
const OWN_TITLES = ['color', 'role', 'style', 'spaceuse', 'radius', 'z']

/** Shift, Ctrl, Cmd 중 하나를 누른 채 누르면 여러 개 선택이다. */
export const isAdditive = (e: MouseEvent) => e.shiftKey || e.ctrlKey || e.metaKey

/**
 * 의미 값이 가리키던 토대 값이 없어졌는지. 종류마다 찾는 길이 달라서 한곳에 모아 둔다. noun은 알림에 적는 낱말이다("가리키는 값이 없어진 색 2개").
 * 가리키지 않고 값을 바로 적은 것(var(…)가 아닌 값)은 없어진 것이 아니다. 의미 글꼴은 값 셋 가운데 하나라도 없으면 없어진 것이다.
 */
const pointsNowhere = (resolve: (all: Token[], value: string) => string | null) => (all: Token[], t: Token) => t.value.trim().startsWith('var(') && resolve(all, t.value) === null
const MISSING: Record<string, { noun: string; lost: (all: Token[], t: Token) => boolean }> = {
  role: { noun: '색', lost: (all, t) => resolveColor(all, t.value) === null },
  style: { noun: '조합', lost: (all, t) => lookOf(all, t.value, t.name)?.broken ?? true },
  spaceuse: { noun: '간격', lost: pointsNowhere(resolveSpace) },
  height: { noun: '크기', lost: pointsNowhere(resolveLength) },
  width: { noun: '크기', lost: pointsNowhere(resolveLength) },
  square: { noun: '크기', lost: pointsNowhere(resolveLength) },
  radius: { noun: '모서리', lost: pointsNowhere(resolveCorner) },
  border: { noun: '테두리', lost: pointsNowhere(resolveThickness) },
  outline: { noun: '테두리', lost: pointsNowhere(resolveThickness) },
  // 그림자의 겹이 가리키는 색상 판의 색이 없어진 경우.
  shadow: { noun: '그림자', lost: (all, t) => shadowRefs(t.value).some((n) => !all.some((x) => x.name === n)) },
}

/**
 * 가리키는 값이 없어진 의미 값의 수를 판 위에 알린다(DESIGN.md board-head). 줄마다 빨갛게 적혀 있지만 목록이 길면 몇 개인지 한눈에 알 수 없다.
 * 누르면 그 가운데 첫 값을 선택해, 오른쪽 패널에서 바로 다시 고를 수 있다. 모든 의미 판이 이것 하나를 쓴다.
 */
function MissingNotice({ count, noun, onPick }: { count: number; noun: string; onPick: () => void }) {
  return (
    <Button variant="danger" data-broken={count} className="mb-heading -ml-button-ghost-x" title="누르면 첫 값을 선택해요. 오른쪽에서 없어진 값을 다시 골라 주세요" onClick={onPick}>
      <TriangleAlert size={16} strokeWidth={ICON_STROKE} />
      가리키는 값이 없어진 {noun} {count}개
    </Button>
  )
}

/** 종류들(보통 하나) 가운데 가리키는 값이 없어진 값이 있으면 알림을 그린다. 종류별로 나누지 않는 보기(의미 크기의 요소별)는 그 판의 종류를 모두 넘긴다. */
export function MissingNotices({ kinds, tokens, onSelect }: { kinds: Kind[]; tokens: Token[]; onSelect: (name: string, additive: boolean) => void }) {
  const lost = tokens.filter((t) => kinds.some((k) => k.matches(t.name) && MISSING[k.id]?.lost(tokens, t)))
  const noun = kinds.map((k) => MISSING[k.id]?.noun).find(Boolean)
  return lost.length > 0 && noun ? <MissingNotice count={lost.length} noun={noun} onPick={() => onSelect(lost[0].name, false)} /> : null
}

/** 한 화면에 속한 종류들을 차례로 그린다. 전체 보기의 판 안에서도 그대로 쓴다. */
export function KindSections({ kinds, tokens, selected, onSelect, onAdd, onAddGroup, onRename, onSelectGroup, emptyGroups, pickedGroup, onPickGroup, folded, onReorderGroup, rolesFolded, onMoveRole, onMoveRoleGroup, onMoveType, onMoveTypeGroup, onResetTypes, onMoveInKind, onMoveKind, onMoveSpaceGroup, onMoveSizeGroup, onMoveRadiusGroup, resetOf, detailsFolded, onToggleDetails, onMakeSizes, onMakeWeights, onMakeTypes }: SectionProps & { kinds: Kind[] }) {
  const single = kinds.length === 1
  // 값이 있는 종류는 파일에 적힌 차례대로 놓는다(끌어서 바꾼 차례가 파일에 남는다). 값이 없는 종류는 그 뒤에 정해진 차례대로 온다.
  const ordered = orderKinds(tokens, kinds)
  // 종류의 제목을 끌어 차례를 바꾼다. 값이 있는 종류만 옮길 수 있다(값이 없으면 파일에 자리가 없다). 종류가 하나뿐인 판에서는 옮길 것이 없다.
  const movable = single ? [] : ordered.filter((k) => tokens.some((t) => k.matches(t.name)))
  const byId = (id: string | null) => kinds.find((k) => k.id === id) ?? null
  const kindDrag = useReorder(movable.map((k) => k.id), single ? undefined : (id, before) => onMoveKind(kinds, byId(id)!, byId(before)), { attr: 'data-kind', gap: 24 })
  return (
    <DetailsFolded.Provider value={!!detailsFolded}>
    <div className="space-y-groups">
      {ordered.map((kind) => {
        const items = tokens.filter((t) => kind.matches(t.name))
        const canMove = movable.includes(kind)
        // 차례를 손으로 바꿀 수 있는 종류에만 끌기를 준다. 크기 있는 종류(글자 크기, 간격…)는 값의 크기순으로 저절로 놓인다.
        const onMove = isFreeKind(kind) || kind.id === 'color' ? (name: string, before: string | null) => onMoveInKind(kind, name, before) : undefined
        const list = { kind, items, selected, onSelect, onAdd, onRename, onMove }
        // 이제 쓰지 않는 종류(따로 떨어진 줄 높이)는 파일에 값이 남아 있을 때만 보여 준다.
        if (kind.legacy && items.length === 0) return null
        // 글자 크기의 줄에는 묶인 줄 높이를 함께 보여 준다.
        const lineOf = kind.id === 'size' ? (name: string) => tokens.find((t) => t.name === lineName(name))?.value : undefined
        // 묶인 글자 사이도 함께 보여 준다.
        const trackOf = kind.id === 'size' ? (name: string) => tokens.find((t) => t.name === trackName(name))?.value : undefined
        return (
          <section key={kind.id} data-kind={kind.id} className={`relative ${kindDrag.moving(kind.id) ? 'opacity-dragging' : ''}`}>
            {canMove && kindDrag.line(kind.id)}
            {(() => {
              // 묶음의 제목 줄. 왼쪽에 제목, 오른쪽에 버튼. 값을 추가하는 것은 목록 끝의 점선 상자가 아니라 여기의 "추가" 버튼이다.
              // 점선 상자는 늘 한 줄의 자리를 차지하고, 값이 없는 묶음에서도 빈 상자가 남는다.
              // 글자 크기와 굵기는 낱개보다 한 벌로 정하는 것이라 "한 벌 만들기"를 함께 둔다.
              // 색은 목록마다, 의미 색은 판 위에 추가 버튼이 따로 있다. 이제 쓰지 않는 종류에는 추가가 없다.
              const makeSet = kind.id === 'size' ? onMakeSizes : kind.id === 'weight' ? onMakeWeights : kind.id === 'style' ? onMakeTypes : undefined
              // 의미 크기(높이, 폭, 정사각형)와 의미 테두리(테두리 선, 외곽선)의 추가도 판 위에 하나만 있고, 종류는 창에서 고른다.
              const canAdd = !['color', 'role', 'height', 'width', 'square', 'border', 'outline'].includes(kind.id) && !kind.legacy
              if (single && !canAdd && !makeSet) return null
              return (
                // 제목 없이 버튼만 있는 줄은 판의 머리 줄이다. 어느 판이나 높이 32px, 오른쪽 정렬, 아래 16px(DESIGN.md board-head).
                // 제목이 있는 줄은 제목의 높이(24px)에 맞추고 버튼이 위아래로 넘친다.
                <div className={single && OWN_TITLES.includes(kind.id) ? 'mb-header flex justify-end' : 'mb-heading flex h-compact items-center justify-between'}>
                  {/* 종류의 제목. 누르면 그 종류의 값이 모두 선택되고, 끌면 판 안에서 종류의 차례가 바뀐다.
                      판 안에 묶음 제목이 따로 있는 종류(색, 의미 색, 의미 글꼴, 의미 간격, 의미 모서리)는 판이 그 종류 하나뿐이라 제목을 두지 않는다. */}
                  {single && OWN_TITLES.includes(kind.id) ? (
                    <span />
                  ) : (
                    <h2>
                      <button
                        type="button"
                        onClick={(e) => !kindDrag.justDragged() && items.length > 0 && onSelectGroup(items.map((t) => t.name), isAdditive(e), false)}
                        {...(canMove ? kindDrag.grab(kind.id) : {})}
                        className={`-ml-chip-x rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus ${canMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {kind.title}
                      </button>
                    </h2>
                  )}
                  <span className="flex gap-actions-tight">
                    {/* "원래대로"는 판마다 하나다. 종류가 하나뿐인 판은 여기에, 여럿인 판은 판 위에 하나만 둔다. */}
                    {single && isFreeKind(kind) && <ResetButton title="묶음과 그 안의 값을 처음 순서로 돌려놓아요" onReset={resetOf(kind)} />}
                    {kind.id === 'style' && <ResetButton title="묶음과 그 안의 조합을 처음 순서로 돌려놓아요" onReset={onResetTypes} />}
                    {single && onToggleDetails && <FoldButton folded={!!detailsFolded} title="설명과 예시를 모두 숨기거나 보여요" onToggle={onToggleDetails} />}
                    {makeSet && (
                      <Button variant="ghost" onClick={makeSet}>
                        <Rows3 size={16} strokeWidth={ICON_STROKE} />한 벌 만들기
                      </Button>
                    )}
                    {canAdd && (
                      <Button variant="ghost" aria-label={kind.addLabel} onClick={() => onAdd(kind)}>
                        <Plus size={16} strokeWidth={ICON_STROKE} />
                        추가
                      </Button>
                    )}
                  </span>
                </div>
              )
            })()}
            <MissingNotices kinds={[kind]} tokens={tokens} onSelect={onSelect} />
            {kind.id === 'color' ? (
              // 색이 하나도 없어도 "예외 색" 목록은 처음부터 있다. 목록은 판 오른쪽 위의 "목록 추가"로 만든다.
              <ColorGroups {...list} onSelectGroup={onSelectGroup} emptyGroups={emptyGroups} pickedGroup={pickedGroup} onPickGroup={onPickGroup} folded={folded} onReorderGroup={onReorderGroup} onAddGroup={onAddGroup} />
            ) : kind.id === 'role' ? (
              <RoleList {...list} all={tokens} folded={rolesFolded} onSelectGroup={onSelectGroup} onMove={onMoveRole} onMoveGroup={onMoveRoleGroup} />
            ) : kind.id === 'style' ? (
              <TypeList items={items} all={tokens} selected={selected} onSelect={onSelect} onSelectGroup={onSelectGroup} onRename={onRename} onMove={onMoveType} onMoveGroup={onMoveTypeGroup} />
            ) : isEffectKind(kind.id) ? (
              // 효과(그림자, 투명도, 흐림)는 의미 판처럼 한 줄에 하나씩, 쓰인 모습과 함께 보여 준다.
              <EffectList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onRename={onRename} onMove={onMove} />
            ) : kind.id === 'spaceuse' ? (
              // 의미 간격은 묶음마다 한 줄에 하나씩, 그 간격이 쓰인 모습과 함께 보여 준다.
              <SpaceList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onSelectGroup={onSelectGroup} onRename={onRename} onMove={onMove} onMoveGroup={onMoveSpaceGroup} />
            ) : kind.id === 'height' || kind.id === 'width' || kind.id === 'square' ? (
              // 의미 크기(높이, 폭, 정사각형)는 묶음마다 한 줄에 하나씩, 그 크기가 실제로 쓰인 모습과 함께 보여 준다.
              <SizeList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onSelectGroup={onSelectGroup} onRename={onRename} onMove={onMove} onMoveGroup={(group, before) => onMoveSizeGroup(kind, group, before)} />
            ) : kind.id === 'z' ? (
              // 겹치는 차례는 묶음마다 한 줄에 하나씩, 그것이 무엇 위에 놓이는지를 보여 주는 예시와 함께 놓는다. 차례는 숫자에서 정해져 끌지 않는다.
              <LayerList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onSelectGroup={onSelectGroup} onRename={onRename} />
            ) : isBorderKind(kind) ? (
              // 의미 테두리(테두리 선, 외곽선)는 효과처럼 한 줄에 하나씩, 그 선이 그어진 모습과 함께 보여 준다.
              <BorderList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onRename={onRename} onMove={onMove} />
            ) : kind.id === 'radius' ? (
              // 의미 모서리는 묶음마다 한 줄에 하나씩, 그 둥글기가 실제로 쓰인 모습과 함께 보여 준다.
              <RadiusList kind={kind} items={items} all={tokens} selected={selected} onSelect={onSelect} onSelectGroup={onSelectGroup} onRename={onRename} onMove={onMove} onMoveGroup={onMoveRadiusGroup} />
            ) : specOf(kind) ? (
              // 움직임(시간, 이징)과 화면 크기(브레이크포인트, 컨테이너 폭, 비율)는 효과처럼 한 줄에 하나씩, 그 값이 제 일을 하는 모습과 함께 보여 준다.
              // 쓰임으로 이름 붙인 종류(시간, 이징, 비율)만 끌어서 차례를 바꾼다. 브레이크포인트와 컨테이너 폭은 크기순으로 저절로 놓인다.
              <ValueList kind={kind} spec={specOf(kind)!} items={items} all={tokens} selected={selected} onSelect={onSelect} onRename={onRename} onMove={onMove} />
            ) : (
              <RowList {...list} lineOf={lineOf} trackOf={trackOf} />
            )}
          </section>
        )
      })}
    </div>
    </DetailsFolded.Provider>
  )
}

/** 판을 접고 펴는 버튼. 판 오른쪽 위에 둔다. */
export function FoldButton({ folded, title, onToggle }: { folded: boolean; title: string; onToggle: () => void }) {
  return (
    <Button variant="ghost" aria-pressed={folded} title={title} onClick={onToggle}>
      {folded ? <ChevronsUpDown size={16} strokeWidth={ICON_STROKE} /> : <ChevronsDownUp size={16} strokeWidth={ICON_STROKE} />}
      {folded ? '펼치기' : '접기'}
    </Button>
  )
}

/** 판 안의 순서를 기본으로 돌려놓는 버튼. 이미 기본 순서면(onReset이 없으면) 누를 수 없다. */
export function ResetButton({ title, onReset }: { title: string; onReset?: () => void }) {
  return (
    <Button variant="ghost" title={title} disabled={!onReset} onClick={onReset}>
      <RotateCcw size={16} strokeWidth={ICON_STROKE} />
      원래대로
    </Button>
  )
}

/** 색상 판의 버튼들. 순서 원래대로, 글자 접기, 목록 추가. */
export function AddColorButtons({
  onAddGroup,
  folded,
  onToggleFold,
  reset,
}: {
  onAddGroup: () => void
  /** 색상 판을 접었는지. onToggleFold가 있을 때만 접기 버튼을 보여 준다. */
  folded?: boolean
  onToggleFold?: () => void
  /** 순서를 기본으로 돌려놓는다. show가 참일 때만 버튼을 보여 주고, run이 없으면 이미 기본 순서라 누를 수 없다. */
  reset?: { run?: () => void }
}) {
  return (
    <span className="flex gap-actions-tight">
      {reset && <ResetButton title="목록과 그 안의 색을 처음 순서로 돌려놓아요" onReset={reset.run} />}
      {onToggleFold && <FoldButton folded={!!folded} title="색 아래의 이름과 값 글자를 모두 숨기거나 보여요" onToggle={onToggleFold} />}
      <Button variant="ghost" onClick={onAddGroup}>
        <Plus size={16} strokeWidth={ICON_STROKE} />
        목록 추가
      </Button>
    </span>
  )
}

type ListProps = {
  kind: Kind
  items: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onAdd: (kind: Kind, group?: string) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 주지 않으면 끌 수 없는 목록이다. */
  onMove?: (name: string, before: string | null) => void
}

// 꼭짓점 사각형과 이름표는 확대 비율과 관계없이 화면에서 같은 크기로 보인다.
export const HANDLE = 'pointer-events-none absolute z-mark size-(--handle) border-edge border-selection bg-canvas [scale:var(--unzoom)] [--handle:7px] [--handle-at:calc((1px-var(--handle))/2)]'
/**
 * 손잡이가 놓이는 네 꼭짓점. 손잡이의 한가운데가 선택 테두리(1px) 위에 오도록, 손잡이 크기에서 테두리 굵기를 뺀 것의 절반만큼 바깥으로 내민다.
 * 자리를 숫자로 따로 적지 않고 손잡이 크기(--handle)에서 계산하므로, 크기를 바꾸면 자리도 따라간다.
 */
export const HANDLE_AT = {
  nw: 'top-(--handle-at) left-(--handle-at)',
  ne: 'top-(--handle-at) right-(--handle-at)',
  sw: 'bottom-(--handle-at) left-(--handle-at)',
  se: 'right-(--handle-at) bottom-(--handle-at)',
}

/** 선택한 항목의 네 꼭짓점에 붙는 작은 사각형. */
export function SelectionHandles() {
  return (
    <>
      <span className={`${HANDLE} ${HANDLE_AT.nw}`} />
      <span className={`${HANDLE} ${HANDLE_AT.ne}`} />
      <span className={`${HANDLE} ${HANDLE_AT.sw}`} />
      <span className={`${HANDLE} ${HANDLE_AT.se}`} />
    </>
  )
}

/** 선택한 항목 바로 아래에 붙는 파란 이름표(이름 · 값). 주변에 무엇이 있든 가장 위에 겹쳐 보인다. */
export function SelectionTag({ name, value }: { name: string; value?: string }) {
  return (
    <span className="pointer-events-none absolute top-full left-1/2 z-callout mt-blocks origin-top -translate-x-1/2 [scale:var(--unzoom)] rounded-tag bg-selection px-chip-x type-caption-strong whitespace-nowrap text-on-selection">
      {value === undefined ? name : `${name} · ${value}`}
    </span>
  )
}

/** 꼭짓점 사각형과 이름표를 함께 붙인다. 항목 전체가 하나의 상자일 때 쓴다. */
export function SelectionLabel({ name, value }: { name: string; value?: string }) {
  return (
    <>
      <SelectionHandles />
      <SelectionTag name={name} value={value} />
    </>
  )
}

// 선택과 호버 표시. 선은 항목의 가장자리에 틈 없이 붙는다(안쪽으로 1px 겹쳐 원래 테두리를 덮는다).
// 피그마와 같게: 마우스를 올리면 2px 선, 선택하면 1px 선에 꼭짓점 사각형과 이름표가 붙는다.
// 선택된 항목도 마우스를 올리면 선이 2px로 두꺼워진다.
// 여러 개를 선택했을 때는 이름표끼리 겹치므로 선만 두른다.
export const OUTLINE = 'line-inset outline-selection'
export const SELECTED = 'line-1'
export const HOVER = 'hover:line-2 focus-visible:line-2'

function ColorGroups({
  kind,
  items,
  selected,
  onSelect,
  onAdd,
  onRename,
  onMove,
  onSelectGroup,
  emptyGroups,
  pickedGroup,
  onPickGroup,
  folded,
  onReorderGroup,
  onAddGroup,
}: ListProps &
  Pick<SectionProps, 'onSelectGroup' | 'emptyGroups' | 'pickedGroup' | 'onPickGroup' | 'folded' | 'onReorderGroup' | 'onAddGroup'>) {
  const groups = new Map<string, Token[]>()
  for (const t of items) {
    const g = groupOf(shortName(kind, t.name))
    groups.set(g, [...(groups.get(g) ?? []), t])
  }
  // 색을 모두 지운 목록도 빈 채로 남겨 둔다.
  for (const g of emptyGroups) if (!groups.has(g)) groups.set(g, [])
  // 예외 색(단계 목록에 속하지 않는 white, black 같은 색)의 목록은 색이 없어도 항상 있다. 색이 있으면 다른 목록처럼 파일에 적힌 자리에 놓이고(끌어 옮길 수 있다), 비어 있으면 맨 아래에 놓인다.
  if (!groups.get('')?.length) {
    groups.delete('')
    groups.set('', [])
  }
  // 예외 색은 크기의 차례가 없는 낱개 색이라 끌어서 차례를 바꾼다. 목록 안의 단계(50~950)는 숫자순으로 저절로 놓여 끌 수 없다.
  const reorder = useReorder((groups.get('') ?? []).map((t) => t.name), onMove, { grid: true })

  // 목록 이름을 잡고 위아래로 끌면 목록의 순서가 바뀐다. 색이 있는 목록만 옮길 수 있다(빈 목록은 파일에 자리가 없다).
  const movable = [...groups].filter(([, list]) => list.length > 0).map(([g]) => g)
  const listDrag = useReorder(movable, onReorderGroup, { attr: 'data-color-group', gap: 24 })

  return (
    <div className="space-y-groups">
      {/*
        목록이 아직 하나도 없으면 "primary"라는 본보기 목록을 흐리게 보여 준다. 예외 색 목록만 덩그러니 있으면 무엇을 하는 곳인지 알기 어렵다.
        실제 값이 아니라 자리 표시다. 누르면 목록 추가 창이 열린다.
      */}
      {groups.size === 1 && (
        <button type="button" aria-label="목록 추가" onClick={onAddGroup} className="group block w-full text-left outline-selection focus-visible:outline-focus">
          <span className="mb-heading block type-title text-ink-faint">primary</span>
          <span className={`grid grid-cols-11 gap-x-cells ${folded ? 'gap-y-cells' : 'gap-y-cells-labeled'}`}>
            {SCALE_STEPS.map((step) => (
              <span key={step}>
                {/* 아직 없는 목록의 자리를 보여 주는 점선 상자. */}
                <span className="block h-[64px] rounded-card dash-box bg-canvas group-hover:bg-hover group-hover:bg-none" />
                {!folded && <span className="mt-blocks block type-body text-ink-faint">{step}</span>}
              </span>
            ))}
          </span>
        </button>
      )}
      {[...groups].map(([group, list]) => (
        <div key={group} data-color-group={group} className={`relative ${listDrag.moving(group) ? 'opacity-dragging' : ''}`}>
          {/* 끄는 중에 놓일 자리를 알려 주는 선. 이 목록 앞에 놓이면 위에, 맨 끝에 놓이면 마지막 목록 아래에 긋는다. */}
          {listDrag.line(group)}
          {/* 영문 목록 이름은 소문자라 작아 보여서 16px, 한글인 '예외 색'은 다른 제목과 같은 14px. */}
          {/* 목록 이름을 누르면 그 목록의 색이 모두 선택되고, 더블클릭하면 오른쪽 패널의 목록 이름 칸으로 간다. */}
          {/* 색이 없는 빈 목록은 이름 자체가 선택되고(파란 선), 그 상태에서 Delete를 누르면 목록이 지워진다. */}
          <div className="mb-heading -ml-chip-x flex items-center gap-actions-tight">
          <button
            type="button"
            data-group-name={group}
            aria-pressed={list.length === 0 ? pickedGroup === group : undefined}
            onClick={(e) => {
              if (listDrag.justDragged()) return
              // 예외 색 목록은 비어 있어도 지울 수 없으므로 선택하지 않는다.
              if (list.length === 0) group && onPickGroup(group)
              else onSelectGroup(list.map((t) => t.name), isAdditive(e), false)
            }}
            // 이름을 잡고 끌면 목록이 옮겨진다. 색이 없는 목록은 끌 수 없다.
            {...(list.length > 0 ? listDrag.grab(group) : {})}
            onDoubleClick={() => list.length > 0 && onSelectGroup(list.map((t) => t.name), false, true)}
            className={`rounded-small px-chip-x outline-selection hover:bg-hover focus-visible:outline-focus ${list.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''} ${group ? 'type-title' : 'type-heading'} ${
              list.length === 0 && pickedGroup === group ? 'line-1' : ''
            }`}
            style={{ '--edge': '0px' } as CSSProperties}
          >
            {group || '예외 색'}
          </button>
          {/* 이 목록에 색을 추가한다. 줄 끝의 점선 칸 대신 이름 옆에 둔다. */}
          <button
            type="button"
            title={group ? `${group} 목록에 색 추가` : '예외 색 추가'}
            aria-label={group ? `${group} 목록에 색 추가` : '예외 색 추가'}
            onClick={() => onAdd(kind, group)}
            className="flex size-icon-button-corner items-center justify-center rounded-small text-ink-faint outline-selection hover:bg-hover hover:text-ink focus-visible:outline-focus"
          >
            <Plus size={16} strokeWidth={ICON_STROKE} />
          </button>
          </div>
          {/* 한 줄에 11칸. 50부터 950까지 11단계인 한 목록이 한 줄에 들어간다. 접으면 글자가 없어지므로 줄 사이를 좁힌다. */}
          <div className={`grid grid-cols-11 gap-x-cells ${folded ? 'gap-y-cells' : 'gap-y-cells-labeled'}`}>
            {list.map((t, i) => {
              const short = shortName(kind, t.name)
              const isSelected = selected.includes(t.name)
              const labeled = isSelected && selected.length === 1
              // 파일에는 oklch로 적혀 있어도 화면에는 읽기 쉬운 #으로 보여 준다.
              const shown = showColor(t.value)
              // 화면이 낼 수 없는 선명한 색이면 #은 가까운 색일 뿐이라는 표시를 붙인다.
              const approx = isApprox(t.value)
              return (
                <button
                  key={t.name}
                  type="button"
                  data-token={t.name}
                  aria-pressed={isSelected}
                  aria-label={`${short} ${shown}`}
                  onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
                  onDoubleClick={() => onRename(t.name)}
                  {...(group ? {} : reorder.grab(t.name))}
                  // 색은 한 줄에 11개까지. 12번째 칸은 추가 칸의 자리라서, 12번째 색부터는 다음 줄 맨 앞에서 시작한다.
                  className={`group relative text-left outline-none select-none ${reorder.moving(t.name) ? 'opacity-dragging' : ''} ${i > 0 && i % 11 === 0 ? 'col-start-1' : ''}`}
                >
                  {!group && reorder.line(t.name)}
                  <span className="relative block">
                    <span
                      className={`block h-[64px] rounded-card shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)] ${isSelected ? SELECTED : ''} group-hover:line-2 group-focus-visible:line-2 ${OUTLINE}`}
                      // 옅은 선은 색 면의 안쪽에 그린다(바깥으로 삐져나오지 않는다). 테두리가 없으므로 선택 선도 면의 가장자리에 딱 맞춘다.
                      style={{ background: swatchBackground(t.value), '--edge': '0px' } as CSSProperties}
                    />
                    {labeled && <SelectionLabel name={short} value={shown} />}
                  </span>
                  {/* 접으면 이름과 값 글자를 숨긴다. 색을 고르면 뜨는 파란 이름표로는 여전히 볼 수 있다. */}
                  {!folded && (
                  <span>
                    <span data-name className="mt-blocks block type-label break-words">
                      {group ? short.slice(group.length + 1) : short}
                    </span>
                    <span
                      className="block type-code break-all text-ink-faint"
                      title={approx ? `${t.value} · 화면이 낼 수 없는 색이라 가까운 색으로 보여 줘요` : undefined}
                    >
                      {approx ? '≈ ' : ''}
                      {shown}
                    </span>
                  </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function RowList({
  kind,
  items,
  selected,
  onSelect,
  onRename,
  onMove,
  lineOf,
  trackOf,
}: ListProps & { lineOf?: (name: string) => string | undefined; trackOf?: (name: string) => string | undefined }) {
  // 값이 긴 종류는 이름·값과 견본을 위아래로 쌓는다.
  const stacked = kind.id === 'font'
  const reorder = useReorder(items.map((t) => t.name), onMove)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  return (
    <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const isSelected = selected.includes(t.name)
        const line = lineOf?.(t.name)
        // 글자 사이를 정하지 않은 크기는 0em으로 적는다. 빼 버리면 그 자리가 비어 보이고, 0이라는 것도 값인데 알 수 없게 된다.
        const track = trackOf ? (trackOf(t.name) ?? '0em') : undefined
        // 글자 크기는 묶인 줄 높이, 글자 사이와 함께 적는다(23px / 32px / -0.01em).
        // 글꼴 종류는 대체 글꼴을 뺀 글꼴 이름만 적는다.
        const shown = stacked ? shownFont(t.value) : [t.value, line, track].filter(Boolean).join(' / ')
        // 토대의 간격과 크기, 모서리, 테두리는 이름이 곧 길이라(8과 8px) 길이만 적는다. 둘 다 적으면 같은 숫자가 겹친다. 예전 이름의 간격(spacing-2)은 이름도 적는다.
        const bare = (kind.id === 'space' || kind.id === 'length' || kind.id === 'corner' || kind.id === 'thickness') && `${short}px` === t.value.trim()
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={bare ? shown : `${short} ${shown}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative w-full rounded-row px-board-row-x py-board-row-y text-left select-none ${stacked ? 'block' : 'flex items-center gap-columns'} ${reorder.moving(t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            {stacked ? (
              // 글꼴 종류는 이름과 글꼴 이름을 한 줄 전체에 쓰고, 견본은 그 아래에 둔다. 글꼴 이름은 좁은 칸에 넣으면 잘린다.
              <>
                <span data-name className="block type-label">{short}</span>
                {/* 다른 줄의 값(14px)보다 작게 12px로 적어 견본 문장이 주인공이 되게 한다. */}
                <span className="block type-code-sm break-words text-ink-faint">{shown}</span>
                <span className="mt-blocks block overflow-hidden">
                  <RowSample kind={kind} value={t.value} />
                </span>
              </>
            ) : (
              <>
                {/* 글자 크기는 값 셋을 한 줄에 적으므로 칸이 넓다. */}
                <span className={`${kind.id === 'size' ? 'w-[192px]' : 'w-[112px]'} shrink-0`}>
                  {/* 이름과 값은 자르지 않는다(말줄임표를 쓰지 않는다). 칸보다 길면 줄을 바꿔 다 보여 준다. */}
                  {!bare && <span data-name className="block type-label break-words">{short}</span>}
                  {/* 이름 없이 길이만 적는 줄(8px)은 그 길이가 곧 이름이라 이름의 글자로 적는다. */}
                  <span data-value className={`block break-words ${bare ? 'type-label' : 'type-code text-ink-faint'}`}>{shown}</span>
                </span>
                <span className="min-w-0 flex-1 overflow-hidden">
                  <RowSample kind={kind} value={t.value} line={line} track={track} />
                </span>
              </>
            )}
            {isSelected && selected.length === 1 && (bare ? <SelectionLabel name={shown} /> : <SelectionLabel name={short} value={shown} />)}
          </button>
        )
      })}
    </div>
  )
}

function RowSample({ kind, value, line, track }: { kind: Kind; value: string; line?: string; track?: string }) {
  switch (kind.id) {
    case 'font':
      // 견본 문장도 자르지 않는다. 판보다 길면 줄을 바꾼다. 큰 글자일수록 여러 줄이 되지만 끝이 "…"로 사라지는 것보다 낫다.
      return <span className="block text-lg leading-[26px] break-words" style={{ fontFamily: value }}>{SAMPLE}</span>
    case 'size':
      // 줄 높이가 묶여 있으면 두 줄로 써서 줄 사이가 보이게 한다. 줄 높이는 한 줄로는 보이지 않는다.
      return line ? (
        <span className="block" style={{ fontSize: value, lineHeight: line, letterSpacing: track }}>
          <span className="block break-words">{SAMPLE}</span>
          <span className="block break-words">{SAMPLE}</span>
        </span>
      ) : (
        <span className="block break-words" style={{ fontSize: value, lineHeight: suggestLine(value) ?? undefined, letterSpacing: track }}>{SAMPLE}</span>
      )
    case 'weight':
      return <span className="block text-lg leading-[26px] break-words" style={{ fontWeight: value }}>{SAMPLE}</span>
    case 'leading':
      return (
        <span className="block" style={{ lineHeight: value }}>
          {SAMPLE}
          <br />
          {SAMPLE}
        </span>
      )
    case 'tracking':
      return <span className="block text-lg leading-[26px] break-words" style={{ letterSpacing: value }}>{SAMPLE}</span>
    case 'space':
      // 간격은 의미 간격 판의 예시와 같은 표시로 보여 준다: 안내 색을 옅게 칠한 띠. 띠의 높이가 그 간격이고, 좌우로는 칸 끝까지 길게 긋는다.
      return <span className="block w-full" style={{ height: value, background: 'color-mix(in oklab, var(--color-guide) 30%, transparent)' }} />
    case 'length':
      // 크기는 치수선으로 보여 준다(의미 크기 판의 예시와 같다): 그 길이의 1px 선과 양 끝의 7px 가로대. 길이는 값 그대로다.
      // 간격처럼 띠로 칠하지 않는다. 띠는 비어 있는 자리의 표시이고 선은 길이의 표시다.
      return (
        // 값의 이름표는 의미 크기 판의 가로 치수선과 같은 자리(선의 위쪽 가운데, 4px 띄움)에 놓는다. 짧은 선에서는 이름표가 선보다 넓어 양옆으로 조금 나오므로 왼쪽을 12px 비워 둔다.
        <span className="block pt-[20px] pl-[12px]">
          <span data-measure="length" className="relative block h-[7px] shrink-0" style={{ width: value }}>
            <span className="absolute inset-x-0 top-[3px] h-px bg-guide" />
            <span className="absolute top-0 left-0 h-full w-px bg-guide" />
            <span className="absolute top-0 right-0 h-full w-px bg-guide" />
            <span data-measure-tag className="absolute bottom-full left-1/2 mb-[4px] -translate-x-1/2 rounded-tag bg-guide px-[4px] type-caption-strong whitespace-nowrap text-on-selection tabular-nums!">
              {parseFloat(value)}
            </span>
          </span>
        </span>
      )
    case 'corner':
      // 모서리는 그 둥글기의 모서리 하나로 보여 준다. 48px 상자의 왼쪽 위 모서리다. 9999px처럼 상자보다 큰 값은 사분원이 된다(끝이 완전히 둥근 것).
      return <span data-corner className="block size-[48px] border-t-edge border-l-edge border-ink-soft bg-hover" style={{ borderTopLeftRadius: value }} />
    case 'thickness':
      // 테두리는 그 굵기의 선 하나로 보여 준다.
      return <span data-thickness className="block w-full max-w-[240px] bg-ink" style={{ height: value }} />
    default:
      return <span className="block h-[12px] max-w-full rounded-tag bg-ink" style={{ width: value }} />
  }
}
