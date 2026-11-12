// FF 화면이 디자인 시스템 파일을 읽고 쓸 수 있게 해 주는 작은 서버.
// 개발 서버 안에서 /api 로 시작하는 요청을 처리한다.

import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { isValidToken, parseTokens, writeTokens } from './tokensCss.ts'

const SYSTEM_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/
const TOKENS_FILE = 'tokens.css'
const CANVAS_FILE = 'ff.canvas.json'
const COMPONENTS_FILE = 'components.json'
const EMPTY_TOKENS = `/* FF가 관리하는 디자인 값입니다. @theme 안의 값은 FF에서 고칠 수 있습니다. */\n@theme {\n}\n`

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
  } catch {
    throw new HttpError(400, '요청 내용을 읽지 못했어요.')
  }
}

export function ffApi(): Plugin {
  let systemsDir = ''

  const systemDir = (name: string) => {
    if (!SYSTEM_NAME.test(name)) {
      throw new HttpError(400, '이름은 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    }
    return path.join(systemsDir, name)
  }

  async function tokensPath(name: string) {
    const file = path.join(systemDir(name), TOKENS_FILE)
    try {
      await fs.access(file)
    } catch {
      throw new HttpError(404, '디자인 시스템을 찾지 못했어요.')
    }
    return file
  }

  async function handle(req: IncomingMessage, res: ServerResponse, url: URL) {
    const parts = url.pathname.split('/').filter(Boolean).slice(1) // 'api' 다음부터
    const method = req.method ?? 'GET'

    if (parts[0] !== 'systems') throw new HttpError(404, '없는 주소예요.')

    // 목록
    if (parts.length === 1 && method === 'GET') {
      await fs.mkdir(systemsDir, { recursive: true })
      const entries = await fs.readdir(systemsDir, { withFileTypes: true })
      const systems = entries
        .filter((e) => e.isDirectory() && SYSTEM_NAME.test(e.name))
        .map((e) => e.name)
        .sort()
      return send(res, 200, { systems })
    }

    // 새로 만들기
    if (parts.length === 1 && method === 'POST') {
      const { name } = await readJson(req)
      const dir = systemDir(String(name ?? ''))
      try {
        await fs.mkdir(dir, { recursive: false })
      } catch (e: any) {
        if (e?.code === 'EEXIST') throw new HttpError(409, '같은 이름의 디자인 시스템이 이미 있어요.')
        if (e?.code === 'ENOENT') {
          await fs.mkdir(systemsDir, { recursive: true })
          await fs.mkdir(dir)
        } else throw e
      }
      await fs.writeFile(path.join(dir, TOKENS_FILE), EMPTY_TOKENS, 'utf-8')
      return send(res, 201, { name })
    }

    // 값 읽기, 쓰기
    if (parts.length === 3 && parts[2] === 'tokens') {
      const name = decodeURIComponent(parts[1])
      const file = await tokensPath(name)
      const shownPath = `systems/${name}/${TOKENS_FILE}`

      if (method === 'GET') {
        const css = await fs.readFile(file, 'utf-8')
        return send(res, 200, { tokens: parseTokens(css), file: shownPath })
      }

      if (method === 'PUT') {
        const { tokens } = await readJson(req)
        if (!Array.isArray(tokens) || !tokens.every(isValidToken)) {
          throw new HttpError(400, '저장할 수 없는 값이 있어요.')
        }
        const names = new Set(tokens.map((t) => t.name))
        if (names.size !== tokens.length) throw new HttpError(400, '같은 이름의 값이 두 개 있어요.')
        const css = await fs.readFile(file, 'utf-8')
        await fs.writeFile(file, writeTokens(css, tokens), 'utf-8')
        return send(res, 200, { ok: true })
      }
    }

    // 전체 보기에서 판을 놓은 위치
    if (parts.length === 3 && parts[2] === 'canvas') {
      const name = decodeURIComponent(parts[1])
      await tokensPath(name) // 시스템이 있는지 확인
      const file = path.join(systemDir(name), CANVAS_FILE)

      if (method === 'GET') {
        try {
          return send(res, 200, { boards: JSON.parse(await fs.readFile(file, 'utf-8')).boards ?? {} })
        } catch {
          return send(res, 200, { boards: {} })
        }
      }

      if (method === 'PUT') {
        const { boards } = await readJson(req)
        const valid =
          boards &&
          typeof boards === 'object' &&
          Object.entries(boards).every(
            ([id, p]: [string, any]) =>
              /^[a-z]+$/.test(id) &&
              Number.isFinite(p?.x) &&
              Number.isFinite(p?.y) &&
              (p.w === undefined || Number.isFinite(p.w)),
          )
        if (!valid) throw new HttpError(400, '저장할 수 없는 위치 값이에요.')
        const clean = Object.fromEntries(
          Object.entries(boards).map(([id, p]: [string, any]) => [
            id,
            { x: Math.round(p.x), y: Math.round(p.y), ...(p.w === undefined ? {} : { w: Math.round(p.w) }) },
          ]),
        )
        await fs.writeFile(file, JSON.stringify({ boards: clean }, null, 2) + '\n', 'utf-8')
        return send(res, 200, { ok: true })
      }
    }

    // 컴포넌트 설정
    if (parts.length === 3 && parts[2] === 'components') {
      const name = decodeURIComponent(parts[1])
      await tokensPath(name) // 시스템이 있는지 확인
      const file = path.join(systemDir(name), COMPONENTS_FILE)
      const shownPath = `systems/${name}/${COMPONENTS_FILE}`

      if (method === 'GET') {
        let text: string
        try {
          text = await fs.readFile(file, 'utf-8')
        } catch {
          return send(res, 200, { components: [], file: shownPath })
        }
        try {
          return send(res, 200, { components: JSON.parse(text).components ?? [], file: shownPath })
        } catch {
          throw new HttpError(500, 'components.json 파일을 읽지 못했어요. 파일 내용을 확인해 주세요.')
        }
      }

      if (method === 'PUT') {
        const { components } = await readJson(req)
        const valid =
          Array.isArray(components) &&
          components.every((c) => c && typeof c === 'object' && SYSTEM_NAME.test(String(c.name ?? '')))
        if (!valid) throw new HttpError(400, '저장할 수 없는 컴포넌트가 있어요.')
        const names = new Set(components.map((c) => c.name))
        if (names.size !== components.length) throw new HttpError(400, '같은 이름의 컴포넌트가 두 개 있어요.')
        await fs.writeFile(file, JSON.stringify({ components }, null, 2) + '\n', 'utf-8')
        return send(res, 200, { ok: true })
      }
    }

    throw new HttpError(404, '없는 주소예요.')
  }

  return {
    name: 'ff-api',
    configResolved(config) {
      systemsDir = path.resolve(config.root, 'systems')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()
        handle(req, res, url).catch((e) => {
          if (e instanceof HttpError) return send(res, e.status, { error: e.message })
          console.error(e)
          send(res, 500, { error: '파일을 처리하다 문제가 생겼어요.' })
        })
      })
    },
  }
}
