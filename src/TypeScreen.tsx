// 글자의 쓰임새를 한 화면으로 보여 주는 예시(주문 관리 화면).
// 일정한 견본 문장을 늘어놓는 대신 실제로 쓰이는 자리에 놓아서, 크기와 굵기와 조합을 화면을 보며 판단하게 한다.
// 의미 글꼴, 글자 크기, 굵기의 한 벌 만들기 창이 함께 쓴다. 자리마다 어떤 모습으로 그릴지는 쓰는 쪽이 정한다.
//
// 글과 글 사이의 여백(줄 높이 말고 따로 띄우는 것)은 네 가지뿐이다. 글자 크기 한 벌 만들기 창의 공지 글도 같은 규칙을 쓴다.
//   0     이름표와 그것이 가리키는 글 (분류 표시 → 숫자, 숫자의 이름표 → 숫자, 날짜 → 제목)
//   8px   제목이나 글과, 바로 이어지는 글 (제목 → 소개 글 → 본문, 카드 제목 → 작은 본문, 입력칸 → 설명, 인용문 → 누구의 말인지)
//   16px  같은 묶음 안의 덩어리 사이 (구역 제목 → 탭 → 카드, 카드의 글 → 버튼, 입력칸 → 버튼)
//   24px  묶음과 묶음 사이, 카드의 안쪽 여백
// 쓰는 값은 4, 8, 12, 16, 24px뿐이다. 한 화면에 놓인 것이 많아서 위아래를 넉넉히 두되, 묶음 사이(24px)를 더 벌리지 않고 글과 글 사이(8px)와 카드의 안쪽(24px)을 넓혔다.
// 이름표와 입력칸 사이만 4px이다. 입력칸은 테두리가 있는 상자라 0으로 붙이면 이름표가 테두리에 닿는다.

import { createContext, useContext, type CSSProperties, type ComponentType, type ReactNode } from 'react'

/** 화면 속의 글자 한 자리. use는 그 자리의 쓰임새 이름(title-lg, body, button…)이다. */
export type SlotProps = { use: string; as?: 'span' | 'p' | 'h3'; className?: string; children: ReactNode }

/**
 * 화면 예시. T는 글자 한 자리를 그리는 부품이고, has는 그 쓰임새의 자리를 둘지다(없는 쓰임새는 자리째로 뺀다).
 * 버튼이나 입력칸처럼 상자를 가진 자리는 상자의 모양(className)까지 T에 넘긴다. 상자까지가 한 덩어리이기 때문이다.
 */
/** 내세우는 숫자들의 이름표와 값. 자리가 몇 개인지(하나, 둘, 셋)에 따라 큰 것부터다. 자리가 많을수록 숫자를 짧게 써서 한 줄에 들어가게 한다. */
const STATS: [label: string, value: string][][] = [
  [['이번 달 매출', '12,480,000원']],
  [
    ['올해 누적 매출', '1억 2,480만 원'],
    ['이번 달 매출', '12,480,000원'],
  ],
  [
    ['올해 누적 매출', '1억 2,480만 원'],
    ['이번 달 매출', '1,248만 원'],
    ['이번 달 주문', '318건'],
  ],
]

export function TypeScreen({ T, has = () => true }: { T: ComponentType<SlotProps>; has?: (use: string) => boolean }) {
  const stats = ['display-xl', 'display-lg', 'display'].filter(has)
  return (
    <>
      {/* 화면의 맨 위는 성과다. 분류 표시(무엇의, 언제의 숫자인지)가 머리에 오고 8px 아래에 큰 숫자들이 놓인다.
          숫자의 이름표는 숫자에 붙고(0), 숫자와 숫자 사이는 24px이다. 그 아래 24px(묶음 사이)을 띄우고 화면 제목이 온다.
          큰 숫자가 없는 한 벌에서는 분류 표시가 화면 제목의 이름표가 되어 제목 바로 위에 붙는다(0). */}
      <T use="overline" as="p" className="text-ink-soft">
        SALES · 2025년 4월
      </T>
      {/* 큰 숫자의 자리는 그만큼 큰 크기가 있을 때만 나온다(단계가 적은 한 벌에는 내세우는 조합이 없다).
          하나에서 셋까지, 있는 만큼 큰 것부터 놓는다. 가장 큰 자리가 가장 무거운 숫자(올해 누적)를 맡는다. 폭이 모자라면 아래 줄로 넘어간다(줄 사이 8px). */}
      {stats.length > 0 && (
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          {stats.map((use, i) => (
            <div key={use}>
              <T use="caption" as="p" className="text-ink-soft">
                {STATS[stats.length - 1][i][0]}
              </T>
              <T use={use} as="p" className="whitespace-nowrap">
                {STATS[stats.length - 1][i][1]}
              </T>
            </div>
          ))}
        </div>
      )}

      {/* 화면 제목과 소개 글과 본문은 8px씩 띄워 잇는다. */}
      <div className={`space-y-2 ${stats.length > 0 ? 'mt-6' : ''}`}>
        {/* 큰 버튼은 화면에 하나뿐인 주된 일이라 화면 제목의 오른쪽에 둔다. 카드 안의 버튼(중간 크기)과 같은 줄에 나란히 놓지 않는다. 크기가 다른 버튼이 같은 자리에 있으면 어긋나 보인다. */}
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2">
            <T use="title-lg" as="h3">
              주문 관리
            </T>
            <T use="body-lg" as="p" className="text-ink-soft">
              오늘 들어온 주문과 배송 상태를 한눈에 봅니다.
            </T>
          </div>
          <T use="button-lg" className="inline-flex shrink-0 rounded-md bg-ink px-5 py-3 whitespace-nowrap text-white">
            새 주문 등록
          </T>
        </div>
        <p>
          <T use="body">오늘 들어온 주문은 </T>
          <T use="body-strong">18건</T>
          {/* 본문은 늘 세 줄이다. 줄과 줄 사이(줄 높이)를 보려면 두 줄로는 모자라다. 창의 폭에 따라 줄 수가 달라지지 않게 문장마다 줄을 바꾼다. */}
          <T use="body">
            이고, 그 가운데 3건은 아직 준비 전입니다.
            <br />
            오후 2시 전에 준비를 마친 주문은 오늘 바로 출고됩니다.
            <br />
            그 뒤에 마친 주문은 내일 아침 첫 차로 나갑니다.
          </T>
        </p>
      </div>

      {/* 구역 하나. 제목과 탭 아래에 카드 둘이 나란히 놓인다. 왼쪽은 주문 한 건, 오른쪽은 그 주문의 배송지다.
          두 카드는 같은 짜임이다: 맨 위에 카드 제목, 가운데에 내용, 맨 아래에 버튼. 높이를 서로 맞추고 버튼은 아래 끝에 붙여서, 내용의 길이가 달라도 위와 아래의 선이 맞는다.
          구역 제목을 둘로 나누어 나란히 놓지 않는다. 같은 높이의 제목 아래에 서로 상관없는 것이 놓이면 한 화면으로 읽히지 않는다. */}
      <div className="mt-6">
        <T use="title-md" as="h3">
          최근 주문
        </T>
        {/* 고른 항목은 굵기로도 구분한다. 항목마다 바탕이 생길 수 있으므로 4px 띄운다. */}
        {has('tab') && (
          <div className="mt-4 flex gap-1">
            <T use="tab-on" className="inline-flex rounded-md bg-hover px-2 py-1">
              전체
            </T>
            <T use="tab" className="inline-flex rounded-md px-2 py-1 text-ink-soft">
              배송 준비
            </T>
            <T use="tab" className="inline-flex rounded-md px-2 py-1 text-ink-soft">
              완료
            </T>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col rounded-lg border border-hairline p-6">
            <div className="flex items-baseline justify-between gap-3">
              <T use="title-sm" as="h3">
                한라봉 선물세트
              </T>
              <T use="numeric" className="whitespace-nowrap">
                38,000원
              </T>
            </div>
            <T use="body-sm" as="p" className="mt-2 text-ink-soft">
              서울 마포구 · 2상자 · 문 앞에 놓아 주세요
              <br />
              오늘 오후 2시 전 출고 예정
            </T>
            {/* 주문 번호 줄은 읽는 글이 아니라 다른 덩어리(번호와 그것을 복사하는 버튼)라 16px 띄운다. */}
            <div className="mt-4 flex items-center gap-2">
              <T use="code" className="rounded-sm bg-hover px-1">
                ORD-0412-0087
              </T>
              <T use="button-sm" className="inline-flex rounded-sm border border-hairline px-2 py-1">
                복사
              </T>
              <T use="caption" className="text-ink-faint">
                2분 전
              </T>
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <T use="button" className="inline-flex rounded-md border border-ink bg-ink px-4 py-2 text-white">
                배송 준비
              </T>
              <T use="button" className="inline-flex rounded-md border border-hairline px-4 py-2">
                주문 보기
              </T>
            </div>
          </div>

          <div className="flex flex-col rounded-lg border border-hairline p-6">
            <T use="title-sm" as="h3">
              배송지
            </T>
            <div className="mt-4">
              <T use="label" as="p" className="mb-1 text-ink-soft">
                받는 분
              </T>
              <T use="body" as="p" className="rounded-md border border-hairline px-3 py-2">
                김하늘
              </T>
              <T use="caption" as="p" className="mt-2 text-ink-faint">
                택배 기사님이 보는 이름이에요.
              </T>
            </div>
            <div className="mt-auto pt-4">
              {/* 옆 카드의 버튼과 같은 크기다. 나란한 카드의 버튼은 크기가 같아야 아랫선과 높이가 함께 맞는다. */}
              <T use="button" className="inline-flex rounded-md border border-ink bg-ink px-4 py-2 text-white">
                배송지 저장
              </T>
            </div>
          </div>
        </div>
      </div>

      {/* 받은 분이 남긴 말. 카드 안에 두면 카드 제목과 크기가 맞먹어 위계가 흐려지므로 화면의 한 묶음으로 따로 둔다.
          혼자 떠 있지 않게, 누가 무엇을 두고 한 말인지를 바로 아래에 붙인다(8px). 왼쪽 선이 둘을 한 덩어리로 묶는다. */}
      <div className="mt-6 space-y-2 border-l-2 border-hairline pl-3">
        <T use="quote" as="p">
          상자를 열자마자 향이 달랐어요.
          <br />
          선물 받으신 분이 바로 전화를 주셨습니다.
        </T>
        <T use="caption" as="p" className="text-ink-faint">
          김하늘 님 · 한라봉 선물세트
        </T>
      </div>
    </>
  )
}

/**
 * 짧은 화면 예시. 주문 한 건을 보는 화면이고, 글꼴 종류 추가 창의 견본(font-sample)과 같은 내용이다.
 * 굵기 한 벌처럼 큰 숫자나 여러 층의 제목이 필요 없는 것을 볼 때 쓴다. 주문 관리 화면을 다 펼치면 자리마다 크기가 달라 굵기보다 크기가 먼저 보인다.
 * 왼쪽은 읽는 것(머리말, 상품 이름, 금액, 안내 문단, 주문 번호), 오른쪽은 고르고 누르는 것(탭, 받는 분, 버튼)이다.
 */
export function ShortScreen({ T, has = () => true }: { T: ComponentType<SlotProps>; has?: (use: string) => boolean }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <T use="caption" as="p" className="text-ink-soft">
          최근 주문 · 2분 전
        </T>
        <T use="title-sm" as="h3">
          한라봉 선물세트
        </T>
        <p className="mt-1">
          <T use="numeric">38,000원</T>
          <T use="body-sm" className="text-ink-soft">
            {' '}
            · 2상자
          </T>
        </p>
        <p className="mt-1">
          <T use="body">오후 2시 전에 준비를 마치면 </T>
          <T use="body-strong">당일에 출고</T>
          <T use="body">됩니다. 수도권은 내일, 그 밖의 지역은 모레 도착합니다.</T>
        </p>
        <T use="code" as="p" className="mt-4 w-fit rounded-sm bg-hover px-1">
          ORD-0412-0087
        </T>
      </div>
      <div>
        {has('tab') && (
          <div className="flex gap-1">
            <T use="tab-on" className="inline-flex rounded-md bg-hover px-2 py-1">
              전체
            </T>
            <T use="tab" className="inline-flex rounded-md px-2 py-1 text-ink-soft">
              배송 준비
            </T>
            <T use="tab" className="inline-flex rounded-md px-2 py-1 text-ink-soft">
              완료
            </T>
          </div>
        )}
        <T use="label" as="p" className="mt-4 mb-1 text-ink-soft">
          받는 분
        </T>
        <T use="body" as="p" className="rounded-md border border-hairline px-3 py-2">
          김하늘
        </T>
        <div className="mt-4 flex gap-2">
          <T use="button" className="inline-flex rounded-md border border-ink bg-ink px-4 py-2 text-white">
            배송 준비
          </T>
          <T use="button" className="inline-flex rounded-md border border-hairline px-4 py-2">
            주문 보기
          </T>
        </div>
      </div>
    </div>
  )
}

type Plain = { looks: Record<string, CSSProperties>; groups: Record<string, string>; hot: string | null; onHot?: (group: string | null) => void }
const PlainContext = createContext<Plain>({ looks: {}, groups: {}, hot: null })

/** 정해 준 모습 그대로 그리는 자리. 모습이 없는 쓰임새는 그리지 않는다. */
function PlainT({ use, as: Tag = 'span', className = '', children }: SlotProps) {
  const { looks, groups, hot, onHot } = useContext(PlainContext)
  const look = looks[use]
  if (!look) return null
  const group = groups[use]
  return (
    <Tag
      data-use={use}
      onMouseEnter={onHot && group ? () => onHot(group) : undefined}
      onMouseLeave={onHot && group ? () => onHot(null) : undefined}
      // 제목처럼 한 줄을 다 차지하는 글자는 폭을 글자에 맞춘다. 그래야 마우스를 올렸을 때의 선이 빈 줄 끝까지 가지 않고 글자만 두른다.
      // 버튼이나 입력칸처럼 상자를 가진 자리는 상자까지가 한 덩어리라 선도 상자를 두른다.
      className={`outline-offset-2 outline-selection ${className.includes('rounded') ? '' : 'rounded-sm'} ${Tag !== 'span' && !className.includes('border') ? 'w-fit' : ''} ${group && hot === group ? 'outline-1' : ''} ${className}`}
      style={look}
    >
      {children}
    </Tag>
  )
}

/**
 * 누르거나 고르는 것 없이 보기만 하는 화면 예시. looks는 쓰임새마다의 글자 모습이다.
 * 굵기 한 벌을 만드는 창에서, 지금 고른 값이 화면에 놓였을 때의 모습을 보여 준다.
 * groups는 쓰임새마다 그것이 어느 묶음(표의 어느 줄)에 드는지다. 주면 표의 줄과 화면의 글자가 서로 짚어 준다:
 * hot과 같은 묶음의 자리에 1px 선이 생기고, 자리에 마우스를 올리면 onHot으로 그 묶음을 알린다.
 */
export function PlainScreen({
  looks,
  groups = {},
  hot = null,
  onHot,
  short = false,
}: {
  looks: Record<string, CSSProperties>
  /** 주문 관리 화면 대신 짧은 화면(주문 한 건)을 그린다. */
  short?: boolean
  groups?: Record<string, string>
  hot?: string | null
  onHot?: (group: string | null) => void
}) {
  return (
    <PlainContext.Provider value={{ looks, groups, hot, onHot }}>
      {short ? <ShortScreen T={PlainT} has={(use) => use in looks} /> : <TypeScreen T={PlainT} has={(use) => use in looks} />}
    </PlainContext.Provider>
  )
}
