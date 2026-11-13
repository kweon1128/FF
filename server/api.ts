// FF 화면이 디자인 시스템 파일을 읽고 쓸 수 있게 해 주는 작은 서버.
// 개발 서버 안에서 /api 로 시작하는 요청을 처리한다.

import { createHash } from 'node:crypto'
import { mkdirSync, watch } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { isValidToken, parseTokens, writeTokens } from './tokensCss.ts'

const SYSTEM_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/
const TOKENS_FILE = 'tokens.css'
const CANVAS_FILE = 'ff.canvas.json'
const COMPONENTS_FILE = 'components.json'
// 판마다 고칠 수 있는 값: 너비, 투명도, 모서리, 테두리 굵기와 채우기·테두리 색.
const BOARD_NUMBERS = ['w', 'opacity', 'radius', 'strokeWidth']
const BOARD_COLORS = ['fill', 'stroke']
const BOARD_FLAGS = ['locked', 'hidden']
const HEX_COLOR = /^#[0-9a-f]{6}$/i
// 캔버스에 붙인 사진. 파일은 시스템 폴더의 images/ 에 둔다.
const IMAGES_DIR = 'images'
const IMAGE_ID = /^img-[a-z0-9]+$/
const IMAGE_FILE = /^[a-z0-9]+\.(png|jpg|webp|gif)$/
const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
const IMAGE_LIMIT = 20 * 1024 * 1024
// 글꼴을 불러오는 코드. AI나 사람이 직접 고치는 파일이고, FF는 읽어서 화면에 불러오기만 한다(추천 글꼴을 고르면 한 줄을 덧붙인다).
const FONTS_FILE = 'fonts.css'
// 글꼴 파일을 직접 넣는 폴더.
const FONTS_DIR = 'fonts'
const FONT_FILE = /^[A-Za-z0-9][A-Za-z0-9._ -]*\.(woff2|woff|ttf|otf)$/
const FONT_TYPES: Record<string, string> = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' }
const FONT_URL = /^https:\/\/[^\s'"()\\]+$/
const EMPTY_FONTS = `/*
  이 디자인 시스템이 쓰는 글꼴을 불러오는 코드입니다. FF가 이 파일을 읽어 글꼴을 화면에 불러옵니다.

  글꼴을 추가하는 방법 (셋 중 하나)
  1. 웹 글꼴 주소:  @import url('https://...');   ← 반드시 파일 맨 위, 다른 규칙보다 앞에 둡니다.
  2. 배포처가 준 코드:  @font-face { font-family: '이름'; src: url('https://...') format('woff2'); }
  3. 글꼴 파일:  파일을 이 폴더의 fonts/ 에 넣고  @font-face { font-family: '이름'; src: url('./fonts/파일.woff2') format('woff2'); }

  여기에 적은 font-family 이름이 FF의 "글꼴 종류 추가" 창에 "이 시스템의 글꼴"로 나타납니다.
  글꼴을 실제로 쓰려면 tokens.css 에 --font-sans: '이름', system-ui, sans-serif; 처럼 적습니다(FF의 창에서 골라도 됩니다).
*/
`
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

async function readBytes(req: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > limit) throw new HttpError(413, '사진이 너무 커요. 20MB까지 넣을 수 있어요.')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

/** FF가 지켜보는 파일들. 이 파일이 FF 밖에서(AI나 편집기로) 바뀌면 화면에 알린다. */
const WATCHED = [TOKENS_FILE, CANVAS_FILE, COMPONENTS_FILE, FONTS_FILE]
const CHANGED = '파일이 FF 밖에서 바뀌었어요.'

const hash = (content: string) => createHash('sha1').update(content).digest('hex')

/** 파일 내용의 지문. 화면이 마지막으로 본 내용과 지금 파일이 같은지 가릴 때 쓴다. 파일이 없으면 ''. */
async function revOf(file: string) {
  try {
    return hash(await fs.readFile(file, 'utf-8'))
  } catch {
    return ''
  }
}

export function ffApi(): Plugin {
  let systemsDir = ''
  // FF가 직접 쓴 내용의 지문. 지켜보다가 바뀐 것을 봤을 때, 내가 쓴 것이면 알리지 않는다.
  const written = new Map<string, string>()

  /**
   * 파일을 쓴다. 화면이 알고 있는 지문(rev)이 지금 파일과 다르면 그 사이에 밖에서 바뀐 것이므로 쓰지 않고 막는다.
   * rev를 주지 않으면 그대로 쓴다.
   */
  async function save(file: string, content: string, rev: unknown) {
    if (typeof rev === 'string' && rev !== (await revOf(file))) throw new HttpError(409, CHANGED)
    const next = hash(content)
    written.set(path.resolve(file), next)
    await fs.writeFile(file, content, 'utf-8')
    return next
  }

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
        return send(res, 200, { tokens: parseTokens(css), file: shownPath, rev: hash(css) })
      }

      if (method === 'PUT') {
        const { tokens, rev } = await readJson(req)
        if (!Array.isArray(tokens) || !tokens.every(isValidToken)) {
          throw new HttpError(400, '저장할 수 없는 값이 있어요.')
        }
        const names = new Set(tokens.map((t) => t.name))
        if (names.size !== tokens.length) throw new HttpError(400, '같은 이름의 값이 두 개 있어요.')
        const css = await fs.readFile(file, 'utf-8')
        return send(res, 200, { ok: true, rev: await save(file, writeTokens(css, tokens), rev) })
      }
    }

    // 전체 보기에서 판을 놓은 위치
    if (parts.length === 3 && parts[2] === 'canvas') {
      const name = decodeURIComponent(parts[1])
      await tokensPath(name) // 시스템이 있는지 확인
      const file = path.join(systemDir(name), CANVAS_FILE)

      if (method === 'GET') {
        try {
          const text = await fs.readFile(file, 'utf-8')
          const saved = JSON.parse(text)
          return send(res, 200, { boards: saved.boards ?? {}, images: saved.images ?? {}, groups: saved.groups ?? [], rev: hash(text) })
        } catch {
          return send(res, 200, { boards: {}, images: {}, groups: [], rev: await revOf(file) })
        }
      }

      if (method === 'PUT') {
        const { boards, images = {}, groups = [], rev } = await readJson(req)
        const valid =
          boards &&
          typeof boards === 'object' &&
          Object.entries(boards).every(
            ([id, p]: [string, any]) =>
              /^[a-z]+$/.test(id) &&
              Number.isFinite(p?.x) &&
              Number.isFinite(p?.y) &&
              BOARD_NUMBERS.every((key) => p[key] === undefined || Number.isFinite(p[key])) &&
              BOARD_COLORS.every((key) => p[key] === undefined || HEX_COLOR.test(String(p[key]))) &&
              BOARD_FLAGS.every((key) => p[key] === undefined || typeof p[key] === 'boolean'),
          )
        const validImages =
          images &&
          typeof images === 'object' &&
          Object.entries(images).every(
            ([id, p]: [string, any]) =>
              IMAGE_ID.test(id) && IMAGE_FILE.test(String(p?.file)) && ['x', 'y', 'w', 'h'].every((key) => Number.isFinite(p[key])),
          )
        if (!valid || !validImages) throw new HttpError(400, '저장할 수 없는 위치 값이에요.')
        const cleanImages = Object.fromEntries(
          Object.entries(images).map(([id, p]: [string, any]) => [
            id,
            { file: p.file, x: Math.round(p.x), y: Math.round(p.y), w: Math.max(1, Math.round(p.w)), h: Math.max(1, Math.round(p.h)) },
          ]),
        )
        const clean = Object.fromEntries(
          Object.entries(boards).map(([id, p]: [string, any]) => [
            id,
            {
              x: Math.round(p.x),
              y: Math.round(p.y),
              // 고치지 않은 값은 파일에 적지 않는다.
              ...Object.fromEntries(BOARD_NUMBERS.filter((key) => p[key] !== undefined).map((key) => [key, Math.round(p[key])])),
              ...Object.fromEntries(BOARD_COLORS.filter((key) => p[key] !== undefined).map((key) => [key, String(p[key]).toLowerCase()])),
              ...Object.fromEntries(BOARD_FLAGS.filter((key) => p[key] === true).map((key) => [key, true])),
            },
          ]),
        )
        // 색을 모두 지워도 남겨 둘 빈 색 목록의 이름들.
        if (!Array.isArray(groups) || !groups.every((g) => typeof g === 'string' && SYSTEM_NAME.test(g))) {
          throw new HttpError(400, '저장할 수 없는 목록 이름이에요.')
        }
        const body = {
          boards: clean,
          ...(Object.keys(cleanImages).length ? { images: cleanImages } : {}),
          ...(groups.length ? { groups: [...new Set(groups)] } : {}),
        }
        return send(res, 200, { ok: true, rev: await save(file, JSON.stringify(body, null, 2) + '\n', rev) })
      }
    }

    // 캔버스에 붙인 사진: 올리기와 내려받기
    if (parts.length >= 3 && parts[2] === 'images') {
      const name = decodeURIComponent(parts[1])
      await tokensPath(name) // 시스템이 있는지 확인
      const dir = path.join(systemDir(name), IMAGES_DIR)

      if (parts.length === 3 && method === 'POST') {
        const ext = IMAGE_TYPES[String(req.headers['content-type'] ?? '').split(';')[0]]
        if (!ext) throw new HttpError(400, 'PNG, JPG, WebP, GIF 사진만 넣을 수 있어요.')
        const bytes = await readBytes(req, IMAGE_LIMIT)
        if (bytes.length === 0) throw new HttpError(400, '빈 사진이에요.')
        const saved = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(path.join(dir, saved), bytes)
        return send(res, 201, { file: saved })
      }

      if (parts.length === 4 && method === 'GET') {
        const wanted = decodeURIComponent(parts[3])
        if (!IMAGE_FILE.test(wanted)) throw new HttpError(404, '사진을 찾지 못했어요.')
        let bytes: Buffer
        try {
          bytes = await fs.readFile(path.join(dir, wanted))
        } catch {
          throw new HttpError(404, '사진을 찾지 못했어요.')
        }
        const ext = wanted.split('.').pop()
        res.statusCode = 200
        res.setHeader('Content-Type', Object.keys(IMAGE_TYPES).find((type) => IMAGE_TYPES[type] === ext)!)
        res.setHeader('Cache-Control', 'max-age=31536000, immutable')
        return res.end(bytes)
      }
    }

    // 글꼴을 불러오는 코드(fonts.css)와 글꼴 파일(fonts/)
    if (parts.length >= 3 && parts[2] === 'fonts') {
      const name = decodeURIComponent(parts[1])
      await tokensPath(name) // 시스템이 있는지 확인
      const file = path.join(systemDir(name), FONTS_FILE)

      if (parts.length === 3 && method === 'GET') {
        let css = ''
        try {
          css = await fs.readFile(file, 'utf-8')
        } catch {
          // 아직 글꼴을 넣은 적이 없는 시스템이다.
        }
        return send(res, 200, { css, file: `systems/${name}/${FONTS_FILE}` })
      }

      // 글꼴을 불러오는 주소 한 줄을 덧붙인다. 이미 있으면 그대로 둔다.
      if (parts.length === 3 && method === 'POST') {
        const { url: href } = await readJson(req)
        if (typeof href !== 'string' || !FONT_URL.test(href)) throw new HttpError(400, '글꼴 주소를 읽지 못했어요.')
        let css = EMPTY_FONTS
        try {
          css = await fs.readFile(file, 'utf-8')
        } catch {
          // 파일이 없으면 안내 주석과 함께 새로 만든다.
        }
        if (css.includes(href)) return send(res, 200, { ok: true, css })
        // @import는 다른 규칙보다 앞에 있어야 한다. 맨 위의 주석과 이미 있는 @import들 바로 뒤에 넣는다.
        const head = /^(?:\s|\/\*[\s\S]*?\*\/|@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;)*/.exec(css)![0]
        const eol = css.includes('\r\n') ? '\r\n' : '\n'
        const before = head.trimEnd()
        const next = `${before}${before ? eol : ''}@import url('${href}');${eol}${css.slice(head.length)}`
        await save(file, next, undefined)
        return send(res, 200, { ok: true, css: next })
      }

      if (parts.length === 4 && method === 'GET') {
        const wanted = decodeURIComponent(parts[3])
        if (!FONT_FILE.test(wanted)) throw new HttpError(404, '글꼴 파일을 찾지 못했어요.')
        let bytes: Buffer
        try {
          bytes = await fs.readFile(path.join(systemDir(name), FONTS_DIR, wanted))
        } catch {
          throw new HttpError(404, '글꼴 파일을 찾지 못했어요.')
        }
        res.statusCode = 200
        res.setHeader('Content-Type', FONT_TYPES[wanted.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream')
        return res.end(bytes)
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
          return send(res, 200, { components: [], file: shownPath, rev: '' })
        }
        try {
          return send(res, 200, { components: JSON.parse(text).components ?? [], file: shownPath, rev: hash(text) })
        } catch {
          throw new HttpError(500, 'components.json 파일을 읽지 못했어요. 파일 내용을 확인해 주세요.')
        }
      }

      if (method === 'PUT') {
        const { components, rev } = await readJson(req)
        const valid =
          Array.isArray(components) &&
          components.every((c) => c && typeof c === 'object' && SYSTEM_NAME.test(String(c.name ?? '')))
        if (!valid) throw new HttpError(400, '저장할 수 없는 컴포넌트가 있어요.')
        const names = new Set(components.map((c) => c.name))
        if (names.size !== components.length) throw new HttpError(400, '같은 이름의 컴포넌트가 두 개 있어요.')
        return send(res, 200, { ok: true, rev: await save(file, JSON.stringify({ components }, null, 2) + '\n', rev) })
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
      // 디자인 시스템 폴더를 직접 지켜본다(Vite는 이 폴더를 지켜보지 않게 해 두었다).
      // FF 밖에서 파일이 바뀌면 화면에 알려서 다시 불러오게 한다. FF가 방금 쓴 내용이면 알리지 않는다.
      mkdirSync(systemsDir, { recursive: true })
      const timers = new Map<string, NodeJS.Timeout>()
      const watcher = watch(systemsDir, { recursive: true }, (_, changed) => {
        if (!changed) return
        const parts = changed.split(/[\\/]/)
        if (parts.length !== 2 || !WATCHED.includes(parts[1]) || !SYSTEM_NAME.test(parts[0])) return
        const file = path.resolve(systemsDir, changed)
        // 한 번 저장해도 신호가 여러 번 오므로 잠깐 모았다가 한 번만 본다.
        clearTimeout(timers.get(file))
        timers.set(
          file,
          setTimeout(async () => {
            timers.delete(file)
            if ((await revOf(file)) === written.get(file)) return
            server.ws.send({ type: 'custom', event: 'ff:changed', data: { system: parts[0], file: parts[1] } })
          }, 80),
        )
      })
      server.httpServer?.on('close', () => watcher.close())
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
