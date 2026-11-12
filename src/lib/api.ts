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

/** 판의 자리. w는 너비를 바꾼 판에만 있다. */
export type Pos = { x: number; y: number; w?: number }

export const getCanvas = (system: string) =>
  request<{ boards: Record<string, Pos> }>(`/api/systems/${encodeURIComponent(system)}/canvas`)

export const putCanvas = (system: string, boards: Record<string, Pos>) =>
  request<{ ok: true }>(`/api/systems/${encodeURIComponent(system)}/canvas`, {
    method: 'PUT',
    body: JSON.stringify({ boards }),
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
