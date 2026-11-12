export type Token = { name: string; value: string }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
  } catch {
    throw new Error('FF 서버에 연결하지 못했어요. 실행 중인지 확인해 주세요.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? '요청을 처리하지 못했어요.')
  return data as T
}

export const listSystems = () => request<{ systems: string[] }>('/api/systems')

export const createSystem = (name: string) =>
  request<{ name: string }>('/api/systems', { method: 'POST', body: JSON.stringify({ name }) })

export const getTokens = (system: string) =>
  request<{ tokens: Token[]; file: string }>(`/api/systems/${encodeURIComponent(system)}/tokens`)

/** 판의 모양. 고치지 않은 값은 비어 있고 기본 모양을 따른다. */
export type BoardStyle = {
  /** 투명도, 0~100 */
  opacity?: number
  /** 모서리, px */
  radius?: number
  /** 채우기 색, #rrggbb */
  fill?: string
  /** 테두리 색, #rrggbb */
  stroke?: string
  /** 테두리 굵기, px */
  strokeWidth?: number
  /** 잠금. 잠근 판은 옮겨지지 않는다. */
  locked?: boolean
  /** 숨김. 숨긴 판은 캔버스에 그리지 않는다. */
  hidden?: boolean
}

export const BOARD_DEFAULTS: Required<BoardStyle> = {
  opacity: 100,
  radius: 8,
  fill: '#ffffff',
  stroke: '#e6e6e6',
  strokeWidth: 1,
  locked: false,
  hidden: false,
}

/** 판의 자리와 모양. w는 너비를 바꾼 판에만 있다. */
export type Pos = { x: number; y: number; w?: number } & BoardStyle

/** 캔버스에 붙인 사진 하나. file은 디자인 시스템 폴더의 images/ 안에 있는 파일 이름. */
export type CanvasImage = { file: string; x: number; y: number; w: number; h: number }

export const getCanvas = (system: string) =>
  request<{ boards: Record<string, Pos>; images: Record<string, CanvasImage> }>(
    `/api/systems/${encodeURIComponent(system)}/canvas`,
  )

export const imageUrl = (system: string, file: string) => `/api/systems/${encodeURIComponent(system)}/images/${file}`

export const uploadImage = (system: string, image: Blob) =>
  request<{ file: string }>(`/api/systems/${encodeURIComponent(system)}/images`, {
    method: 'POST',
    headers: { 'Content-Type': image.type },
    body: image,
  })

export const putCanvas = (system: string, boards: Record<string, Pos>, images: Record<string, CanvasImage>) =>
  request<{ ok: true }>(`/api/systems/${encodeURIComponent(system)}/canvas`, {
    method: 'PUT',
    body: JSON.stringify({ boards, images }),
  })

export const getComponents = (system: string) =>
  request<{ components: unknown; file: string }>(`/api/systems/${encodeURIComponent(system)}/components`)

export const putComponents = (system: string, components: unknown[]) =>
  request<{ ok: true }>(`/api/systems/${encodeURIComponent(system)}/components`, {
    method: 'PUT',
    body: JSON.stringify({ components }),
  })

export const putTokens = (system: string, tokens: Token[]) =>
  request<{ ok: true }>(`/api/systems/${encodeURIComponent(system)}/tokens`, {
    method: 'PUT',
    body: JSON.stringify({ tokens }),
  })
