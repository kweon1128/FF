// 움직임 판과 화면 크기 판의 종류마다, 줄 목록·패널·추가 창에 넘길 것(ValueSpec)을 찾는다.

import type { Kind } from './lib/catalog'
import { LAYOUT_SPECS } from './Layout'
import { MOTION_SPECS } from './Motion'
import type { ValueSpec } from './ValueBoard'

/** 그 종류가 움직임이나 화면 크기의 종류면 그 종류의 것을, 아니면 null을 돌려준다. */
export function specOf(kind: Kind): ValueSpec | null {
  const all: Record<string, ValueSpec> = { ...(MOTION_SPECS as unknown as Record<string, ValueSpec>), ...(LAYOUT_SPECS as unknown as Record<string, ValueSpec>) }
  return all[kind.id] ?? null
}
