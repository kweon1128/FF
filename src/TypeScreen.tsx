// 글자의 쓰임새를 한 화면으로 보여 주는 예시(주문 관리 화면).
// 일정한 견본 문장을 늘어놓는 대신 실제로 쓰이는 자리에 놓아서, 크기와 굵기와 조합을 화면을 보며 판단하게 한다.
// 의미 글꼴, 글자 크기, 굵기의 한 벌 만들기 창이 함께 쓴다. 자리마다 어떤 모습으로 그릴지는 쓰는 쪽이 정한다.

import { createContext, useContext, type CSSProperties, type ComponentType, type ReactNode } from 'react'

/** 화면 속의 글자 한 자리. use는 그 자리의 쓰임새 이름(title-lg, body, button…)이다. */
export type SlotProps = { use: string; as?: 'span' | 'p' | 'h3'; className?: string; children: ReactNode }

/**
 * 화면 예시. T는 글자 한 자리를 그리는 부품이고, has는 그 쓰임새의 자리를 둘지다(없는 쓰임새는 자리째로 뺀다).
 * 버튼이나 입력칸처럼 상자를 가진 자리는 상자의 모양(className)까지 T에 넘긴다. 상자까지가 한 덩어리이기 때문이다.
 */
export function TypeScreen({ T, has = () => true }: { T: ComponentType<SlotProps>; has?: (use: string) => boolean }) {
  return (
    <>
      <T use="overline" as="p" className="mb-2 text-ink-soft">
        SALES · 2025년 4월
      </T>
      <div className="flex items-end gap-10">
        {has('display-lg') && (
          <div>
            <T use="caption" as="p" className="text-ink-soft">
              올해 누적 매출
            </T>
            <T use="display-lg" as="p">
              1억 2,480만 원
            </T>
          </div>
        )}
        <div>
          <T use="caption" as="p" className="text-ink-soft">
            이번 달 매출
          </T>
          <T use="display" as="p">
            12,480,000원
          </T>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        <T use="title-lg" as="h3">
          주문 관리
        </T>
        <T use="body-lg" as="p" className="text-ink-soft">
          오늘 들어온 주문과 배송 상태를 한눈에 봅니다.
        </T>
        <p className="pt-1">
          <T use="body">오늘 들어온 주문은 </T>
          <T use="body-strong">18건</T>
          <T use="body">이고, 그중 3건이 아직 배송 준비 전입니다. 오후 2시 전에 준비를 마치면 당일에 출고됩니다.</T>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <T use="title-md" as="h3">
            최근 주문
          </T>
          {/* 고른 항목은 굵기로도 구분한다. 항목마다 바탕이 생길 수 있으므로 4px 띄운다. */}
          {has('tab') && (
            <div className="mt-2 flex gap-1">
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
          <div className="mt-3 rounded-lg border border-hairline p-4">
            <div className="flex items-baseline justify-between gap-3">
              <T use="title-sm" as="h3">
                한라봉 선물세트
              </T>
              <T use="numeric" className="whitespace-nowrap">
                38,000원
              </T>
            </div>
            <T use="body-sm" as="p" className="mt-1 text-ink-soft">
              서울 마포구 · 2상자 · 문 앞에 놓아 주세요
            </T>
            <div className="mt-2 flex items-center gap-2">
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
            <div className="mt-4 flex gap-2">
              <T use="button" className="inline-flex rounded-md bg-ink px-4 py-2 text-white">
                배송 준비
              </T>
              <T use="button" className="inline-flex rounded-md border border-hairline px-4 py-2">
                주문 보기
              </T>
            </div>
          </div>
        </div>

        <div>
          <T use="title-md" as="h3">
            배송지 고치기
          </T>
          <div className="mt-3 space-y-3">
            <div>
              <T use="label" as="p" className="mb-1 text-ink-soft">
                받는 분
              </T>
              <T use="body" as="p" className="rounded-md border border-hairline px-3 py-2">
                김하늘
              </T>
              <T use="caption" as="p" className="mt-1 text-ink-faint">
                택배 기사님이 보는 이름이에요.
              </T>
            </div>
            <T use="button-lg" className="inline-flex rounded-md bg-ink px-5 py-3 text-white">
              배송지 저장
            </T>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <T use="quote" as="p" className="border-l-2 border-hairline pl-3">
          상자를 열자마자 향이 달랐어요. 선물 받으신 분이 바로 전화를 주셨습니다.
        </T>
      </div>
    </>
  )
}

const LooksContext = createContext<Record<string, CSSProperties>>({})

/** 정해 준 모습 그대로 그리는 자리. 모습이 없는 쓰임새는 그리지 않는다. */
function PlainT({ use, as: Tag = 'span', className = '', children }: SlotProps) {
  const look = useContext(LooksContext)[use]
  if (!look) return null
  return (
    <Tag data-use={use} className={className} style={look}>
      {children}
    </Tag>
  )
}

/**
 * 누르거나 고르는 것 없이 보기만 하는 화면 예시. looks는 쓰임새마다의 글자 모습이다.
 * 글자 크기 한 벌과 굵기 한 벌을 만드는 창에서, 지금 고른 값이 화면에 놓였을 때의 모습을 보여 준다.
 */
export function PlainScreen({ looks }: { looks: Record<string, CSSProperties> }) {
  return (
    <LooksContext.Provider value={looks}>
      <TypeScreen T={PlainT} has={(use) => use in looks} />
    </LooksContext.Provider>
  )
}
