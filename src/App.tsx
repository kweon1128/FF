import { ICON_STROKE } from './lib/icons'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  ConflictError,
  NOTE_LIMIT,
  NOTE_SIZES,
  getCanvas,
  imageUrl,
  getComponents,
  getTokens,
  listSystems,
  putCanvas,
  putComponents,
  putTokens,
  uploadImage,
  type BoardStyle,
  type CanvasImage,
  type NoteSize,
  type Pos,
  type Token,
} from './lib/api'
import {
  ALL_KINDS,
  KINDS,
  boundNames,
  lineName,
  trackName,
  markRoles,
  SPACE_REF,
  LENGTH_REF,
  CORNER_REF,
  THICKNESS_REF,
  lengthLabel,
  PLACEHOLDER_SCREENS,
  SLUG, slugMessage,
  TOKEN_SCREENS,
  TOKEN_SCREEN_IDS,
  groupOf,
  isTokenScreen,
  nextStep,
  shortName,
  type Kind,
  type ScreenId,
} from './lib/catalog'
import {
  STATES,
  cloneVariant,
  compCss,
  freshName,
  newComp,
  newSize,
  newVariant,
  normalize,
  renameRef,
  usesOf,
  type Cell,
  type Colors,
  type Comp,
} from './lib/components'
import { isColor, showColor, toHex, toOklch } from './lib/color'
import { SCALE_STEPS, grayOf, makeScale } from './lib/scale'
import { adoptColors, defaultColorOrder, duplicateTokens, kindOf, followLine, followTrack, lineOf, pasteName, pasteTokens, scanCss, shiftTokens, suggestLine, toCss, trackOf, withLine, withTrack } from './lib/tokens'
import type { Placed } from './lib/arrange'
import { BatchRename } from './BatchRename'
import { BoardInspector, ImageInspector, NoteInspector } from './BoardInspector'
import { Canvas, boardPositions, defaultWidth } from './Canvas'
import { NewRoleForm, RoleInspector } from './Roles'
import { ROLE_USES, defaultRoleOrder, moveRole, moveRoleGroup, readNote as readRoleNote, roleGroups, shiftRoles, refOf, refTo, surroundings, type RoleUse } from './lib/roles'
import { onFilesChanged } from './lib/watch'
import { SwatchContext } from './ColorPicker'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { ComponentInspector } from './ComponentInspector'
import { ComponentScreen } from './ComponentScreen'
import { Inspector, MultiInspector } from './Inspector'
import { Nav } from './Nav'
import { NewGroupForm } from './NewGroup'
import { NewSoloForm } from './NewSolo'
import { NewEffectForm } from './NewEffect'
import { NewFontForm, SampleContext } from './NewFont'
import { NewSizesForm } from './NewSizes'
import { NewWeightsForm } from './NewWeights'
import { NewTypeForm, TypeInspector } from './Types'
import { EffectInspector } from './Effects'
import { NewRadiusForm, RadiusInspector } from './Radius'
import { RADIUS_GROUPS, readRadiusNote, type RadiusGroup } from './lib/radius'
import { BorderInspector, NewBorderForm } from './Borders'
import { BORDER_GROUPS, borderGroupOf, isBorderKind, type BorderGroup } from './lib/borders'
import { LayerInspector, NewLayerForm } from './Layers'
import { NewValueForm, ValueInspector } from './ValueBoard'
import { specOf } from './valueSpecs'
import { followShadowRefs, isEffectKind, shadowRefs } from './lib/effects'
import { colorRefsIn, followColorRefs } from './lib/gradient'
import { easeRefsIn, followEaseRefs } from './lib/motion'
import { NewSpaceUseForm, SpaceUseInspector, spaceVars } from './Spacing'
import { LengthInspector, NewLengthForm, NewSizeForm, SizeBoard, SizeInspector, sizeVars } from './Sizes'
import { SIZE_GROUPS, isSizeKind, readSizeNote, sizeGroupOfToken, sizeKindOf } from './lib/sizes'
import type { SpaceUse } from './lib/spacing'
import { autoOrder, colorListSlot, newGroupSlot, moveRadiusGroup, borderGroupOrder, moveBorderGroup, shiftBorders, radiusGroupOrder, shiftRadii, defaultFreeOrder, defaultKindOrder, isAutoOrdered, isFreeKind, moveException, moveInKind, moveKind, moveSpaceGroup, orderKinds, shiftSpaceUses, spaceUseOrder, stepBefore, moveSizeBoardGroup, moveSizeInGroup, shiftSizeInGroup, sizeBoardGroupOrder, defaultSizeOrder } from './lib/order'
import { SPACE_USES, readSpaceNote } from './lib/spacing'
import { NewTypesForm } from './NewTypes'
import { TYPE_USES, readTypeNote, defaultTypeOrder, followTypeRefs, moveType, moveTypeGroup, shiftTypes, syncTypes, typeGroups, typeUsers, withTypeTrack, type TypeUse } from './lib/types'
import { nextPreset, nextSize, nextSizeName, nextVariantName, stepUp, type SizeStep } from './lib/presets'
import { loadFont, loadSystemFonts, parseFontValue } from './lib/fonts'
import { NewSystemForm } from './NewSystem'
import { Palette, type PaletteItem } from './Palette'
import { PasteDialog, type PasteJob } from './PasteDialog'
import { Shortcuts } from './Shortcuts'
import { MissingNotices, AddColorButtons, DetailsFolded, FoldButton, KindSections, ResetButton } from './TokenScreen'
import { TopBar, type SaveStatus } from './TopBar'
import { Button, EmptyState, Field, Modal, inputClass } from './ui'

const LAST_SYSTEM_KEY = 'ff.system'
/** 줄마다 설명과 예시가 있어서 접을 수 있는 판(의미 색과 색상 판은 접기가 따로 있다). */
const FOLDABLE: string[] = ['style', 'spaceuse', 'effect', 'sizeuse', 'radius', 'border', 'z', 'motion', 'layout']
const SAVE_DELAY = 300
const COLOR = KINDS.color
const ROLE = KINDS.role
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight
const STYLE = KINDS.style

/** 색 값을 파일에 저장하는 형식(oklch)으로 맞춘다. #, rgb, hsl로 적힌 색만 바꾸고, 나머지는 그대로 둔다. */
function storeColors(tokens: Token[]): Token[] {
  let changed = false
  const next = tokens.map((t) => {
    if (!COLOR.matches(t.name) || !isColor(t.value)) return t
    const value = toOklch(t.value)
    if (value === t.value) return t
    changed = true
    return { ...t, value }
  })
  return changed ? next : tokens
}
const NOTICE_MS = 2000

/** 입력칸에 글자를 쓰는 중인지. 쓰는 중에는 단축키가 동작하지 않는다. */
/** 지나온 자리 하나. 화면과 거기서 골라 두었던 것(값, 판, 컴포넌트와 그 칸). */
type Place = { screen: ScreenId; selected: string[]; boards: string[]; compIndex: number; cells: Cell[] }

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)

function remember(name: string) {
  try {
    localStorage.setItem(LAST_SYSTEM_KEY, name)
  } catch {
    // 저장소를 못 쓰는 환경에서는 마지막 선택을 기억하지 않는다.
  }
}

function recall() {
  try {
    return localStorage.getItem(LAST_SYSTEM_KEY)
  } catch {
    return null
  }
}

type SaveReport = (result: 'saving' | 'saved' | Error) => void

/** 고칠 때마다 잠깐 기다렸다가 한 번에 파일로 저장한다. */
function useSaver<T>(save: (system: string, data: T) => Promise<unknown>, report: SaveReport) {
  const pending = useRef<{ system: string; data: T; timer: number } | null>(null)
  // 저장은 한 번에 하나씩 차례로 한다. 앞의 저장이 끝나야 파일의 새 지문을 알 수 있어서다.
  const chain = useRef<Promise<void>>(Promise.resolve())

  const flush = useCallback(() => {
    chain.current = chain.current.then(async () => {
      const job = pending.current
      if (!job) return
      pending.current = null
      window.clearTimeout(job.timer)
      try {
        await save(job.system, job.data)
        if (!pending.current) report('saved')
      } catch (e) {
        report(e instanceof Error ? e : new Error())
      }
    })
    return chain.current
  }, [save, report])

  /** 아직 저장하지 않은 변경을 버린다. 밖에서 바뀐 파일을 다시 불러올 때 쓴다. */
  const cancel = useCallback(() => {
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = null
  }, [])

  const queue = useCallback(
    (system: string, data: T) => {
      report('saving')
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = { system, data, timer: window.setTimeout(flush, SAVE_DELAY) }
    },
    [flush, report],
  )

  return { queue, flush, cancel }
}

type CanvasData = { boards: Record<string, Pos>; images: Record<string, CanvasImage>; groups: string[] }

/** 되돌리기를 위해 기억해 두는 한 시점의 내용. */
type Snapshot = {
  tokens: Token[]
  comps: Comp[]
  boards: Record<string, Pos>
  images: Record<string, CanvasImage>
  /** 색을 모두 지워도 남겨 둔 빈 색 목록들. */
  groups: string[]
}

/** 붙여넣은 사진이 이보다 넓으면 이 너비로 줄여서 놓는다. */
const PASTED_IMAGE_WIDTH = 800

const HISTORY_LIMIT = 100
// 이 시간 안에 이어진 변경(글자 입력, 방향키 이동 등)은 한 번의 되돌리기로 묶는다.
const HISTORY_GROUP = 500

type Confirm = { title: string; body: ReactNode; run: () => void }

export function App() {
  const [systems, setSystems] = useState<string[] | null>(null)
  const [system, setSystem] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  // 의미 색과 단계 색은 값으로 가린다. 값 목록이 바뀌면 종류를 가리는 기준도 함께 바뀌어야 하므로 그릴 때마다 맞춘다.
  markRoles(tokens)
  const [comps, setComps] = useState<Comp[]>([])
  const [boards, setBoards] = useState<Record<string, Pos>>({})
  // 캔버스에 붙인 사진들. 선택은 판과 함께 selectedBoards에 담는다.
  const [images, setImages] = useState<Record<string, CanvasImage>>({})
  // 사진을 올리는 동안 바뀐 내용을 놓치지 않도록 가장 최근 것을 따로 들고 있는다.
  // 색을 모두 지워도 사라지지 않게 이름을 따로 기억해 두는 색 목록들.
  const [keptGroups, setKeptGroups] = useState<string[]>([])
  // 선택한 빈 색 목록. 빈 목록은 색이 없어서 목록 이름 자체를 선택하고 Delete로 지운다.
  const [pickedGroup, setPickedGroup] = useState<string | null>(null)
  // 글 적기 상태(T). 이때 캔버스를 누르면 그 자리에 글 상자가 열린다. Esc나 T를 다시 누르면 풀린다.
  const [placingText, setPlacingText] = useState(false)
  // 목록 이름을 눌러 선택한 색 목록. 색이 하나뿐인 목록은 선택된 색만 봐서는 목록을 고른 것인지 그 색을 고른 것인지 알 수 없어서 따로 기억한다.
  // 목록을 고른 것이면 패널에 목록 이름 칸이, 색을 고른 것이면 그 색의 패널이 뜬다. 선택이 바뀌면 지운다.
  const [listPicked, setListPicked] = useState<string | null>(null)
  // 색상 판을 접었는지. 접으면 모든 색의 이름과 값 글자를 숨긴다. 보는 방식일 뿐이라 파일이 아니라 브라우저에 기억한다.
  const [folded, setFolded] = useState(false)
  useEffect(() => {
    try {
      setFolded(localStorage.getItem(`ff.folded.${system}`) === 'true')
    } catch {
      setFolded(false)
    }
  }, [system])

  // 의미 색 판을 접었는지. 접으면 설명과 예시를 숨기고 색과 이름만 보여 준다. 색상 판과 따로 기억한다.
  const [rolesFolded, setRolesFolded] = useState(false)
  useEffect(() => {
    try {
      setRolesFolded(localStorage.getItem(`ff.rolesFolded.${system}`) === 'true')
    } catch {
      setRolesFolded(false)
    }
  }, [system])

  // 의미 글꼴, 의미 간격, 효과 판을 접었는지(판의 이름 → 접음). 접으면 설명과 예시를 숨기고 이름과 값만 보여 준다. 판마다 따로 기억한다.
  const [plainBoards, setPlainBoards] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try {
      setPlainBoards(JSON.parse(localStorage.getItem(`ff.plainBoards.${system}`) ?? '{}'))
    } catch {
      setPlainBoards({})
    }
  }, [system])
  function togglePlain(id: string) {
    const next = { ...plainBoards, [id]: !plainBoards[id] }
    setPlainBoards(next)
    try {
      localStorage.setItem(`ff.plainBoards.${system}`, JSON.stringify(next))
    } catch {
      // 저장소를 못 쓰면 접은 상태를 기억하지 않는다.
    }
  }

  function toggleRolesFold() {
    setRolesFolded(!rolesFolded)
    try {
      localStorage.setItem(`ff.rolesFolded.${system}`, String(!rolesFolded))
    } catch {
      // 저장소를 못 쓰면 접은 상태를 기억하지 않는다.
    }
  }

  function toggleFold() {
    setFolded(!folded)
    try {
      localStorage.setItem(`ff.folded.${system}`, String(!folded))
    } catch {
      // 저장소를 못 쓰면 접은 상태를 기억하지 않는다.
    }
  }
  const latest = useRef({ boards, images })
  latest.current = { boards, images }
  const [file, setFile] = useState('')
  const [compFile, setCompFile] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [screen, setScreen] = useState<ScreenId>('canvas')
  // 선택한 기본 값의 이름들. Shift를 누른 채 누르면 여러 개가 담긴다.
  const [selected, setSelected] = useState<string[]>([])
  // 컴포넌트 화면에서 보고 있는 컴포넌트와 선택한 칸들.
  // 전체 보기에서 선택한 판들.
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [focusNonce, setFocusNonce] = useState(0)
  const [compIndex, setCompIndex] = useState(0)
  const [cells, setCells] = useState<Cell[]>([])
  // 지나온 자리들. "쓰이는 곳"이나 찾기로 다른 값이나 컴포넌트로 건너뛸 때마다 떠나온 자리를 쌓아 두고, 뒤로와 앞으로로 오간다.
  const [trail, setTrail] = useState<{ back: Place[]; forward: Place[] }>({ back: [], forward: [] })
  // 다른 항목을 고를 때만 올린다. 이름을 바꿀 때는 그대로 두어 입력 중인 칸이 유지되게 한다.
  const [selectionId, setSelectionId] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  // 빈 목록에 첫 색을 넣는 중이면 그 목록의 이름. 단계와 색을 묻는 창이 뜬다.
  const [addingFirst, setAddingFirst] = useState<string | null>(null)
  // 예외 색(white, black 등)을 만드는 창이 떠 있는지.
  const [addingSolo, setAddingSolo] = useState(false)
  // 효과(그림자, 투명도, 흐림)를 만드는 창이 어느 종류로 떠 있는지.
  const [addingEffect, setAddingEffect] = useState<Kind | null>(null)
  // 의미 간격을 만드는 창이 떠 있는지.
  const [addingSpaceUse, setAddingSpaceUse] = useState(false)
  // 의미 크기를 만드는 창이 떠 있는지. 종류(높이, 폭, 정사각형)는 창에서 고른다.
  const [addingSize, setAddingSize] = useState(false)
  // 토대의 길이(크기, 간격, 모서리)를 만드는 창이 어느 종류로 떠 있는지.
  const [addingLength, setAddingLength] = useState<Kind | null>(null)
  // 의미 모서리를 만드는 창이 떠 있는지.
  const [addingRadius, setAddingRadius] = useState(false)
  // 의미 테두리(테두리 선, 외곽선)를 만드는 창이 어느 종류로 떠 있는지.
  const [addingBorder, setAddingBorder] = useState<Kind | null>(null)
  // 겹치는 차례를 만드는 창이 떠 있는지.
  const [addingLayer, setAddingLayer] = useState(false)
  // 움직임(시간, 이징)이나 화면 크기(브레이크포인트, 컨테이너 폭, 비율)의 값을 만드는 창이 어느 종류로 떠 있는지.
  const [addingValue, setAddingValue] = useState<Kind | null>(null)
  // 의미 글꼴을 만드는 창이 떠 있는지.
  const [addingType, setAddingType] = useState(false)
  const [addingRole, setAddingRole] = useState(false)
  const [addingFont, setAddingFont] = useState(false)
  const [makingSizes, setMakingSizes] = useState(false)
  const [makingWeights, setMakingWeights] = useState(false)
  const [makingTypes, setMakingTypes] = useState(false)
  // 이 시스템의 글꼴 종류가 추천 글꼴이면, 깔려 있지 않아도 판과 패널의 견본이 그 글꼴로 그려지게 불러온다. 쓰는 글꼴만, 모든 굵기로.
  const usedFonts = tokens
    .filter((t) => FONT.matches(t.name))
    .map((t) => parseFontValue(t.value).font)
    .join('|')
  useEffect(() => {
    for (const family of usedFonts.split('|')) loadFont(family)
  }, [usedFonts])
  // 시스템을 열면 그 시스템의 글꼴(fonts.css)을 화면에 불러온다.
  useEffect(() => {
    if (system) void loadSystemFonts(system)
  }, [system])
  // 붙여넣기 전에 정할 것이 있을 때(이름이 같은 값, 읽지 못한 값) 띄우는 창의 내용.
  const [pasting, setPasting] = useState<PasteJob | null>(null)
  // FF에서 마지막으로 복사한 글자. 이것을 그대로 붙이는 것은 복제하려는 것이므로 덮어쓸지 묻지 않는다.
  const lastCopied = useRef('')
  const [addingComp, setAddingComp] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  // 빠른 실행에서 값을 고르면 그 값이 화면 가운데에 오게 한다.
  const [focusToken, setFocusToken] = useState<string | null>(null)
  // 이름 바꾸기를 청하면 오른쪽 패널의 그 이름 칸으로 커서를 옮긴다. n은 같은 칸을 다시 청해도 동작하게 한다.
  const [renameAsk, setRenameAsk] = useState<{ what: 'token' | 'variant' | 'size' | 'group'; n: number } | null>(null)
  useEffect(() => {
    if (!renameAsk) return
    // 이름이 곧 길이인 토대 값(8px)의 패널에는 이름 칸이 없다. 그 값은 길이 칸이 이름 칸이다.
    const input =
      document.querySelector<HTMLInputElement>(`aside [data-rename="${renameAsk.what}"]`) ??
      (renameAsk.what === 'token' ? document.querySelector<HTMLInputElement>('aside input[aria-label="길이"]') : null)
    input?.focus()
    input?.select()
  }, [renameAsk])
  const [palette, setPalette] = useState(false)
  // 여러 값의 이름을 한꺼번에 바꾸는 창.
  const [batch, setBatch] = useState(false)
  const [help, setHelp] = useState(false)
  // 메뉴와 패널을 숨기고 가운데만 보는 상태(Ctrl+\).
  const [bare, setBare] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef(0)
  // 속성 복사(Ctrl+Alt+C)로 담아 둔 것. 값이면 종류와 값, 판이면 모양, 컴포넌트 칸이면 색 세 가지.
  const copied = useRef<
    | { type: 'token'; kind: string; value: string }
    | { type: 'board'; style: BoardStyle }
    | { type: 'cell'; colors: Colors }
    | null
  >(null)

  /** 화면 아래에 잠깐 뜨는 알림. */
  function notify(text: string) {
    setNotice(text)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }

  function copyText(text: string, done: string) {
    navigator.clipboard.writeText(text).then(
      () => notify(done),
      () => {
        // 브라우저가 막으면 예전 방식(보이지 않는 칸을 골라 복사)으로 한 번 더 해 본다.
        const box = document.createElement('textarea')
        box.value = text
        box.style.position = 'fixed'
        box.style.opacity = '0'
        document.body.append(box)
        box.select()
        const ok = document.execCommand('copy')
        box.remove()
        notify(ok ? done : '복사하지 못했어요.')
      },
    )
  }

  // 파일마다 마지막으로 읽거나 쓴 내용의 지문. 저장할 때 함께 보내서, 그 사이에 밖에서 바뀌었으면 덮어쓰지 않게 한다.
  const revs = useRef({ tokens: '', comps: '', canvas: '' })
  // 밖에서 바뀐 파일을 다시 불러오는 함수. 저장이 막혔을 때와 서버가 알려 왔을 때 부른다.
  const reload = useRef<(why: 'blocked' | 'changed') => void>(() => {})

  const report = useCallback<SaveReport>((result) => {
    if (typeof result === 'string') return setStatus(result)
    // 그 사이에 파일이 밖에서 바뀌어 저장이 막혔다. 방금 고친 것은 버리고 파일을 다시 불러온다.
    if (result instanceof ConflictError) return reload.current('blocked')
    setStatus('error')
    setSaveError(result.message || null)
  }, [])

  const saveTokens = useCallback(
    (name: string, data: Token[]) => putTokens(name, data, revs.current.tokens).then((r) => void (revs.current.tokens = r.rev)),
    [],
  )
  const saveComps = useCallback(
    (name: string, data: Comp[]) => putComponents(name, data, revs.current.comps).then((r) => void (revs.current.comps = r.rev)),
    [],
  )
  const saveCanvas = useCallback(
    (name: string, d: CanvasData) =>
      putCanvas(name, d.boards, d.images, d.groups, revs.current.canvas).then((r) => void (revs.current.canvas = r.rev)),
    [],
  )
  const tokenSaver = useSaver<Token[]>(saveTokens, report)
  const compSaver = useSaver<Comp[]>(saveComps, report)
  const canvasSaver = useSaver<CanvasData>(saveCanvas, report)
  const flushTokens = tokenSaver.flush
  const flushComps = compSaver.flush
  const flushCanvas = canvasSaver.flush
  const queueTokens = tokenSaver.queue

  /** 디자인 시스템의 파일 셋을 읽어 화면에 올린다. */
  const load = useCallback(
    async (name: string) => {
      const [data, canvas, components] = await Promise.all([getTokens(name), getCanvas(name), getComponents(name)])
      revs.current = { tokens: data.rev, comps: components.rev, canvas: canvas.rev }
      // 예전에 #으로 저장된 색은 열 때 한 번에 oklch로 바꿔 파일에 다시 쓴다. 화면에 보이는 # 값은 그대로다.
      // 차례가 값의 크기로 정해지는 종류(글자 크기, 간격, 색 목록 안의 단계…)는 열 때 제자리에 놓는다.
      const stored = storeColors(autoOrder(data.tokens))
      setTokens(stored)
      if (stored !== data.tokens) queueTokens(name, stored)
      setFile(data.file)
      setBoards(canvas.boards)
      setImages(canvas.images ?? {})
      setKeptGroups(canvas.groups ?? [])
      setComps(normalize(components.components))
      setCompFile(components.file)
      return { tokens: stored, boards: canvas.boards, images: canvas.images ?? {} }
    },
    [queueTokens],
  )

  const openSystem = useCallback(
    async (name: string) => {
      await Promise.all([flushTokens(), flushComps(), flushCanvas()])
      history.current = { undo: [], redo: [], at: 0 }
      setSystem(name)
      setSelectedBoards([])
      setSelected([])
      setCells([])
      setCompIndex(0)
      setTrail({ back: [], forward: [] })
      setStatus('idle')
      setLoadError(null)
      remember(name)
      try {
        await load(name)
      } catch (e) {
        setTokens([])
        setBoards({})
        setImages({})
        setKeptGroups([])
        setComps([])
        setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.')
      }
    },
    [flushTokens, flushComps, flushCanvas, load],
  )

  useEffect(() => {
    let cancelled = false
    listSystems()
      .then(({ systems }) => {
        if (cancelled) return
        setSystems(systems)
        const last = recall()
        const first = last && systems.includes(last) ? last : systems[0]
        if (first) openSystem(first)
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [openSystem])

  // FF 밖에서(AI나 편집기로) 파일이 바뀌면 다시 불러온다. FF가 들고 있던 예전 내용으로 덮어쓰지 않기 위해서다.
  const systemNow = useRef(system)
  systemNow.current = system
  reload.current = (why) => {
    const name = systemNow.current
    if (!name) return
    // 아직 저장하지 않은 변경은 예전 내용을 바탕으로 한 것이라 저장하지 않는다.
    tokenSaver.cancel()
    compSaver.cancel()
    canvasSaver.cancel()
    // 바뀌기 전의 모습을 되돌리기 기록에 남긴다. 밖에서(AI가) 바꾼 것이 마음에 들지 않으면 Ctrl+Z로 물릴 수 있다.
    const before = { tokens, comps, boards, images, groups: keptGroups }
    history.current.undo.push(before)
    if (history.current.undo.length > HISTORY_LIMIT) history.current.undo.shift()
    history.current.redo = []
    history.current.at = 0
    load(name)
      .then((now) => {
        // 무엇이 바뀌었는지 바로 보이도록, 새로 생기거나 값이 달라진 것을 선택한다.
        const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
        const was = new Map(before.tokens.map((t) => [t.name, t.value]))
        const changed = now.tokens.filter((t) => was.get(t.name) !== t.value).map((t) => t.name)
        const removed = before.tokens.filter((t) => !now.tokens.some((n) => n.name === t.name)).length
        const moved = [...new Set([...Object.keys(now.boards), ...Object.keys(before.boards)])].filter(
          (id) => !now.boards[id]?.hidden && !same(now.boards[id], before.boards[id]),
        )
        if (changed.length) setSelected(changed)
        setSelectedBoards(changed.length ? [] : moved)
        setCells([])
        setPickedGroup(null)
        setSelectionId((n) => n + 1)
        setStatus('idle')
        const what = [changed.length ? `값 ${changed.length}개가 바뀌었고` : '', removed ? `${removed}개가 없어졌고` : ''].filter(Boolean).join(' ')
        const head = why === 'blocked' ? '파일이 밖에서 바뀌어 있어서 다시 불러왔어요. 방금 고친 것은 반영되지 않았어요.' : '파일이 밖에서 바뀌어 다시 불러왔어요.'
        notify(what ? `${head} ${what.replace(/고$/, '어요.')} Ctrl+Z로 되돌릴 수 있어요.` : head)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : '불러오지 못했어요.'))
  }

  // 서버가 "이 디자인 시스템의 파일이 밖에서 바뀌었다"고 알려 오면 다시 불러온다. 파일 여러 개가 한꺼번에 바뀌어도 한 번만 한다.
  useEffect(() => {
    let timer = 0
    const stop = onFilesChanged((data) => {
      // 글꼴을 불러오는 코드(fonts.css)는 값이 아니라서 다시 불러올 것이 없다. 글꼴 쪽에서 따로 읽는다.
      if (data.system !== systemNow.current || data.file === 'fonts.css') return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => reload.current('changed'), 150)
    })
    return () => {
      window.clearTimeout(timer)
      stop()
    }
  }, [])

  // 되돌리기와 다시 실행. 파일 내용(값, 컴포넌트, 판 위치)이 바뀌기 직전의 모습을 쌓아 둔다.
  const history = useRef<{ undo: Snapshot[]; redo: Snapshot[]; at: number }>({ undo: [], redo: [], at: 0 })

  function record() {
    const h = history.current
    const now = Date.now()
    if (now - h.at > HISTORY_GROUP) {
      h.undo.push({ tokens, comps, boards, images, groups: keptGroups })
      if (h.undo.length > HISTORY_LIMIT) h.undo.shift()
    }
    h.at = now
    h.redo = []
  }

  function saveBoards(next: Record<string, Pos>, nextImages = images, nextGroups = keptGroups) {
    if (!system) return
    setBoards(next)
    setImages(nextImages)
    setKeptGroups(nextGroups)
    canvasSaver.queue(system, { boards: next, images: nextImages, groups: nextGroups })
  }

  /** from에서 하나를 꺼내 그 모습으로 돌아가고, 지금 모습은 to에 쌓는다. */
  function travel(from: Snapshot[], to: Snapshot[]) {
    const snap = from.pop()
    if (!snap || !system) return
    to.push({ tokens, comps, boards, images, groups: keptGroups })
    history.current.at = 0
    if (snap.tokens !== tokens) {
      setTokens(snap.tokens)
      tokenSaver.queue(system, snap.tokens)
    }
    if (snap.comps !== comps) {
      setComps(snap.comps)
      compSaver.queue(system, snap.comps)
    }
    if (snap.boards !== boards || snap.images !== images || snap.groups !== keptGroups) saveBoards(snap.boards, snap.images, snap.groups)
    // 되돌리거나 다시 실행해서 바뀐 것을 선택한다. 무엇이 달라졌는지 바로 보이게 하려는 것이다.
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
    const was = new Map(tokens.map((t) => [t.name, t.value]))
    // 값: 다시 생겼거나(이름이 바뀐 것 포함) 값이 달라진 것.
    const changedTokens = snap.tokens.filter((t) => was.get(t.name) !== t.value).map((t) => t.name)
    // 판과 사진: 자리나 모양이 달라졌거나 다시 생긴 것. 숨긴 판은 뺀다.
    const changedBoards = [
      // 한 번도 옮기지 않았던 판은 기록에 없으므로(기본 자리), 지금 쪽에만 있는 판도 함께 본다.
      ...[...new Set([...Object.keys(snap.boards), ...Object.keys(boards)])].filter(
        (id) => !snap.boards[id]?.hidden && !same(snap.boards[id], boards[id]),
      ),
      ...Object.keys(snap.images).filter((id) => !same(snap.images[id], images[id])),
    ]
    if (changedTokens.length) {
      setSelected(changedTokens)
      setSelectedBoards([])
    } else if (changedBoards.length) {
      setSelected([])
      setSelectedBoards(changedBoards)
    } else {
      // 지워진 것만 있으면(또는 순서만 바뀌었으면) 남아 있는 선택을 그대로 둔다.
      setSelected(selected.filter((name) => snap.tokens.some((t) => t.name === name)))
      setSelectedBoards((ids) => ids.filter((id) => !id.startsWith('img-') || id in snap.images))
    }
    setPickedGroup(null)

    // 컴포넌트: 색이 달라진 칸, 없으면 달라진 크기의 칸을 선택한다.
    const comp = snap.comps[compIndex]
    const now = comps[compIndex]
    const last = cells.at(-1)
    const changedCells: Cell[] = []
    if (comp && now && comp !== now) {
      comp.variants.forEach((variant, v) =>
        STATES.forEach(({ id }) => {
          if (!same(variant.states[id], now.variants[v]?.states[id])) changedCells.push({ v, s: Math.min(last?.s ?? 0, comp.sizes.length - 1), state: id })
        }),
      )
      if (changedCells.length === 0)
        comp.sizes.forEach((size, s) => {
          if (!same(size, now.sizes[s])) changedCells.push({ v: Math.min(last?.v ?? 0, comp.variants.length - 1), s, state: 'default' })
        })
    }
    setCells(
      changedCells.length ? changedCells : comp ? cells.filter((c) => c.v < comp.variants.length && c.s < comp.sizes.length) : [],
    )
    if (!comp) setCompIndex(0)
    setSelectionId((n) => n + 1)
  }

  function commit(next: Token[]) {
    if (!system) return
    record()
    markRoles(next)
    // 어떤 길로 들어온 색이든(새로 만든 기본 색, 스포이드, 붙여넣기) 저장할 때는 oklch로 맞춘다.
    // 의미 글꼴은 글자 크기에 묶인 줄 높이와 글자 사이를 따라가므로, 저장할 때마다 지금의 크기에 맞춘다.
    // 차례가 값의 크기로 정해지는 종류는 저장할 때마다 제자리에 놓는다. 값을 고쳐 크기가 달라지면 줄이 제 차례로 옮겨 간다.
    const stored = storeColors(syncTypes(autoOrder(next)))
    setTokens(stored)
    tokenSaver.queue(system, stored)
  }

  function commitComps(next: Comp[]) {
    if (!system) return
    record()
    setComps(next)
    compSaver.queue(system, next)
  }

  function select(names: string[]) {
    setSelected(names)
    setPickedGroup(null)
    setListPicked(null)
    setSelectionId((n) => n + 1)
  }

  /** additive면 지금 선택에 더하거나(이미 있으면) 뺀다. */
  function pick(name: string, additive: boolean) {
    if (!additive) return select([name])
    select(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name])
  }

  function selectCells(next: Cell[]) {
    setCells(next)
    setSelectionId((n) => n + 1)
  }

  function pickCell(cell: Cell, additive: boolean) {
    if (!additive) return selectCells([cell])
    const same = (c: Cell) => c.v === cell.v && c.s === cell.s && c.state === cell.state
    selectCells(cells.some(same) ? cells.filter((c) => !same(c)) : [...cells, cell])
  }

  function insert(token: Token, after: (t: Token) => boolean) {
    const last = tokens.findLastIndex(after)
    const at = last === -1 ? tokens.length : last + 1
    commit([...tokens.slice(0, at), token, ...tokens.slice(at)])
    select([token.name])
  }

  /**
   * 분류가 있는 의미 값(의미 색, 의미 글꼴, 의미 간격, 의미 크기, 의미 모서리)을 추가한다.
   * 그 분류가 판에 이미 있으면 늘 놓던 자리(after 뒤)에 놓는다. 아직 없던 분류면 맨 뒤가 아니라 정해진 분류 순서의 제자리에 놓는다(newGroupSlot).
   */
  function insertInGroup<G>(token: Token, group: G, groupOf: (t: Token) => G | null, order: readonly G[], after: (t: Token) => boolean) {
    const at = newGroupSlot(tokens, groupOf, group, order)
    if (at < 0) return insert(token, after)
    commit([...tokens.slice(0, at), token, ...tokens.slice(at)])
    select([token.name])
  }

  function addToken(kind: Kind, group?: string) {
    // 예외 색은 이름을 정해야 하므로 바로 만들지 않고 이름과 색을 묻는다.
    if (kind.id === 'color' && !group) return setAddingSolo(true)
    // 의미 색은 이름과 가리키는 색을 정해야 만들 수 있다.
    if (kind.id === 'role') return setAddingRole(true)
    // 글꼴 종류는 이름과 글꼴을 정해야 한다. 글꼴 이름은 틀려도 조용히 다른 글꼴로 보이므로 목록에서 고르게 한다.
    if (kind.id === 'font') return setAddingFont(true)
    // 효과는 단계가 아니라 쓰임으로 이름 붙이므로, 무엇에 쓸지를 묻고 그 쓰임의 이름과 추천 값으로 만든다.
    if (isEffectKind(kind.id)) return setAddingEffect(kind)
    // 의미 간격은 이름과 가리키는 간격을 정해야 만들 수 있다.
    if (kind.id === 'spaceuse') return setAddingSpaceUse(true)
    // 의미 크기(높이, 폭, 정사각형)도 이름과 가리키는 크기를 정해야 만들 수 있다.
    if (isSizeKind(kind)) return setAddingSize(true)
    // 토대의 크기와 간격, 모서리, 테두리는 길이를 받아 그 숫자를 이름으로 만든다.
    if (kind.id === 'length' || kind.id === 'space' || kind.id === 'corner' || kind.id === 'thickness') return setAddingLength(kind)
    // 의미 테두리(테두리 선, 외곽선)도 이름과 가리키는 테두리를 정해야 만들 수 있다.
    if (isBorderKind(kind)) return setAddingBorder(kind)
    // 겹치는 차례는 이름과 차례의 숫자를 정해야 만들 수 있다. 무엇보다 위여야 하는지는 사람이 정한다.
    if (kind.id === 'z') return setAddingLayer(true)
    // 움직임과 화면 크기의 값도 이름과 값을 정해야 만들 수 있다. 종류마다 묻는 값이 달라서(시간, 곡선, 폭, 비율) 추가는 종류의 제목 줄마다 있다.
    if (specOf(kind)) return setAddingValue(kind)
    // 의미 모서리도 이름과 가리키는 모서리를 정해야 만들 수 있다.
    if (kind.id === 'radius') return setAddingRadius(true)
    // 의미 글꼴도 이름과 조합, 분류를 묻는 창을 연다(다른 의미 판의 추가와 같다). 짝지을 재료(글꼴 종류, 글자 크기, 굵기)가 모자라면 그 창이 무엇을 먼저 만들지 알린다.
    if (kind.id === 'style') return setAddingType(true)

    if (kind.id === 'color' && group) {
      const inGroup = (t: Token) => kind.matches(t.name) && groupOf(shortName(kind, t.name)) === group
      const stepOf = (t: Token) => shortName(kind, t.name).slice(group.length + 1)
      const list = tokens.filter(inGroup)
      const steps = list.map(stepOf)
      // 빈 목록의 첫 색은 바로 만들지 않고, 목록을 만들 때처럼 단계와 색을 묻는다.
      if (list.length === 0) return setAddingFirst(group)
      // 다음 단계: 50~950 중 지금 가장 큰 단계 다음의 빈 단계. 뒤가 다 찼으면 앞쪽의 빈 단계, 빈 목록이면 500.
      const nums = steps.map(Number).filter(Number.isFinite)
      const missing = SCALE_STEPS.filter((s) => !steps.includes(String(s)))
      const next = nums.length === 0 ? (missing.includes(500) ? 500 : missing[0]) : (missing.find((s) => s > Math.max(...nums)) ?? missing[0])
      if (next === undefined) return insert({ name: `${kind.prefix}${group}-${nextStep(steps)}`, value: kind.defaultValue }, inGroup)
      // 색은 아무 색이 아니라 그 단계에 맞게 계산한다. 목록에 있는 색(500이 있으면 500, 없으면 가장 가까운 단계)을 기준으로 삼고,
      // 기준으로 삼을 색이 없으면 그 단계 밝기의 회색을 쓴다.
      // 기준이 될 수 있는 것은 불투명한 색(#rrggbb로 보이는 색)이다.
      const hexOf = (t: Token) => toHex(t.value) ?? ''
      const bases = list.filter((t) => hexOf(t).length === 7 && SCALE_STEPS.includes(Number(stepOf(t))))
      const base =
        bases.find((t) => stepOf(t) === '500') ??
        bases.sort((a, b) => Math.abs(Number(stepOf(a)) - next) - Math.abs(Number(stepOf(b)) - next))[0]
      const value = toOklch(base ? makeScale(hexOf(base), Number(stepOf(base)))[next] : (grayOf(next) ?? kind.defaultValue))
      const added = { name: `${kind.prefix}${group}-${next}`, value }
      // 번호 순서에 맞는 자리에 넣는다. 번호가 아닌 이름은 맨 뒤에 둔다.
      const order = (t: Token) => (Number.isFinite(Number(stepOf(t))) ? Number(stepOf(t)) : Infinity)
      const sorted = [...list, added].sort((a, b) => order(a) - order(b))
      const rest = tokens.filter((t) => !inGroup(t))
      const first = tokens.findIndex(inGroup)
      const at = first === -1 ? rest.findLastIndex((t) => kind.matches(t.name)) + 1 : tokens.slice(0, first).filter((t) => !inGroup(t)).length
      commit([...rest.slice(0, at), ...sorted, ...rest.slice(at)])
      return select([added.name])
    }

    // 아무 이름(new)과 고정된 값이 아니라, 지금 있는 것 다음에 올 단계가 이름과 값을 갖추고 생긴다.
    const next = nextPreset(kind, tokens)
    const name = kind.prefix + next.name
    if (kind.id === 'size') {
      // 글자 크기는 줄 높이, 글자 사이와 한 분류로 만든다. 다른 크기의 묶인 값 뒤에 놓이도록 --text-로 시작하는 마지막 줄 뒤에 넣는다.
      // 크기는 정해진 표의 값이 아니라 지금 있는 크기들을 이어 간 값이다. 한 벌 만들기로 만든 단계들 뒤에 눌러도 같은 간격으로 이어진다.
      const made = nextSize(tokens)
      const line = made.line
      const track = made.track
      const at = tokens.findLastIndex((t) => t.name.startsWith(kind.prefix)) + 1 || tokens.length
      const bound = [...(line ? [{ name: lineName(name), value: line }] : []), ...(track ? [{ name: trackName(name), value: track }] : [])]
      commit([...tokens.slice(0, at), { name, value: made.size }, ...bound, ...tokens.slice(at)])
      return select([name])
    }
    insert({ name, value: next.value }, (t) => kind.matches(t.name))
  }

  /** 새 색 목록을 만든다. 첫 색의 단계와 색은 만드는 창에서 정한다. scale이면 그 색을 기준으로 50~950을 모두 만든다. */
  function addGroup(group: string, step: string, value: string, scale = false) {
    setAddingGroup(false)
    const colors = scale ? makeScale(value, Number(step)) : null
    const made = colors
      ? SCALE_STEPS.map((s) => ({ name: `${COLOR.prefix}${group}-${s}`, value: toOklch(colors[s]) }))
      : [{ name: `${COLOR.prefix}${group}-${step}`, value: toOklch(value) }]
    // 맨 끝에 붙이지 않고 색조 순서의 제자리에 끼워 넣는다(회색, 빨강, 주황, 노랑, 초록, 파랑, 보라, 분홍). 놓은 뒤에는 손으로 옮길 수 있다.
    const at = colorListSlot(tokens, toOklch(value))
    commit([...tokens.slice(0, at), ...made, ...tokens.slice(at)])
    select(made.map((t) => t.name))
  }

  /** 이름이 바뀐 색을 가리키던 의미 색, 이름이 바뀐 간격을 가리키던 의미 간격이 새 이름을 따라가게 한다. */
  function followRefs(list: Token[], renames: Record<string, string>) {
    return list.map((t) => {
      const ref = refOf(t.value)
      if (ref && renames[ref]) return { ...t, value: refTo(renames[ref]) }
      // 그림자의 겹이 가리키는 색도 새 이름을 따라간다.
      if (KINDS.shadow.matches(t.name)) {
        const value = followShadowRefs(t.value, renames)
        return value === t.value ? t : { ...t, value }
      }
      // 애니메이션이 가리키는 이징도 새 이름을 따라간다.
      if (KINDS.animate.matches(t.name)) {
        const value = followEaseRefs(t.value, renames)
        return value === t.value ? t : { ...t, value }
      }
      // 그라데이션이 가리키는 색도 같다.
      if (KINDS.gradient.matches(t.name)) {
        const value = followColorRefs(t.value, renames)
        return value === t.value ? t : { ...t, value }
      }
      // 의미 간격은 가리키는 간격의, 의미 크기는 가리키는 크기의, 의미 모서리는 가리키는 모서리의 새 이름을 따라간다.
      const space = (SPACE_REF.exec(t.value) ?? LENGTH_REF.exec(t.value) ?? CORNER_REF.exec(t.value) ?? THICKNESS_REF.exec(t.value))?.[1]
      return space && renames[space] ? { ...t, value: `var(${renames[space]})` } : t
    })
  }

  /** 의미 색을 만든다. ref는 가리키는 색의 변수 이름, note는 주석에 적을 역할과 설명. */
  function addRole(name: string, ref: string, note: string) {
    setAddingRole(false)
    insertInGroup(
      { name, value: refTo(ref), note },
      readRoleNote(note, name.slice(ROLE.prefix.length)).use,
      (t) => (ROLE.matches(t.name) ? readRoleNote(t.note, shortName(ROLE, t.name)).use : null),
      ROLE_USES.map((u) => u.id),
      (t) => ROLE.matches(t.name),
    )
  }

  /** 글꼴 종류를 만든다. value는 맨 앞 글꼴과 대체 글꼴을 이은 font-family 값. */
  function addFont(name: string, value: string) {
    setAddingFont(false)
    insert({ name: FONT.prefix + name, value }, (t) => FONT.matches(t.name))
  }

  /**
   * 한 벌을 통째로 갈아 끼운다. 그 종류의 예전 값(old)을 모두 지우고 그 자리에 새 한 벌(made)을 넣는다.
   * 한 벌 만들기는 그 종류를 통째로 새로 정하는 일이다. 새 한 벌에 없는 이름의 예전 값을 남기면, 4단계였던 것을 3단계로 다시 만들어도 넷째가 남아 한 벌이 되지 않는다.
   * 지워지는 값을 쓰는 곳이 있으면 창에서 만들기 전에 알린다(SetNotice). 예전 값이 없으면 fallback이 알려 주는 자리에 넣는다.
   */
  function replaceSet(old: (t: Token) => boolean, made: Token[], fallback: (rest: Token[]) => number, picked: string[]) {
    const first = tokens.findIndex(old)
    const rest = tokens.filter((t) => !old(t))
    const at = first === -1 ? fallback(rest) : tokens.slice(0, first).filter((t) => !old(t)).length
    commit([...rest.slice(0, at), ...made, ...rest.slice(at)])
    select(picked)
  }

  /** 지금 있는 그 종류의 값마다 그것을 쓰는 곳들의 이름(의미 글꼴, 컴포넌트). 한 벌을 만들 때 지워지는 값이 쓰이고 있는지 알리는 데 쓴다. */
  const usersOfKind = (kind: Kind): Record<string, string[]> =>
    Object.fromEntries(
      tokens
        .filter((t) => kind.matches(t.name))
        // 의미 글꼴과 컴포넌트의 이름이 같으면(button) 한 번만 적는다.
        .map((t) => [shortName(kind, t.name), [...new Set([...typeUsers(tokens, t.name).map((u) => shortName(STYLE, u)), ...usesOf(comps, t.name).map((u) => u.name)])]]),
    )

  /** 글자 크기 한 벌을 넣는다. 예전의 글자 크기와 거기 묶인 줄 높이, 글자 사이는 모두 지운다. 작은 것부터 차례로, 예전 크기들이 있던 자리(없으면 글꼴 종류 뒤)에 놓는다. */
  function makeSizes(steps: SizeStep[]) {
    setMakingSizes(false)
    const made = steps.flatMap((s) => [
      { name: SIZE.prefix + s.name, value: s.size },
      { name: lineName(SIZE.prefix + s.name), value: s.line },
      ...(s.track ? [{ name: trackName(SIZE.prefix + s.name), value: s.track }] : []),
    ])
    replaceSet(
      (t) => t.name.startsWith(SIZE.prefix),
      made,
      (rest) => rest.findLastIndex((t) => FONT.matches(t.name)) + 1 || rest.length,
      steps.map((s) => SIZE.prefix + s.name),
    )
  }

  /** 굵기 한 벌을 넣는다. 예전의 굵기는 모두 지운다. 얇은 것부터 차례로, 예전 굵기들이 있던 자리(없으면 글자 크기 뒤, 그것도 없으면 글꼴 종류 뒤)에 놓는다. */
  function makeWeights(steps: { name: string; value: string }[]) {
    setMakingWeights(false)
    const made = steps.map((s) => ({ name: WEIGHT.prefix + s.name, value: s.value }))
    replaceSet(
      (t) => WEIGHT.matches(t.name),
      made,
      (rest) => rest.findLastIndex((t) => t.name.startsWith(SIZE.prefix) || FONT.matches(t.name)) + 1 || rest.length,
      made.map((t) => t.name),
    )
  }

  /** 의미 글꼴 한 벌을 넣는다. 예전의 의미 글꼴과 거기 붙은 글자 사이는 모두 지운다. 예전 것들이 있던 자리(없으면 맨 뒤)에 놓는다. */
  function makeTypes(made: Token[]) {
    setMakingTypes(false)
    replaceSet(
      (t) => t.name.startsWith(STYLE.prefix),
      made,
      (rest) => rest.length,
      made.filter((t) => STYLE.matches(t.name)).map((t) => t.name),
    )
  }

  function renameToken(from: string, to: string) {
    // 글자 크기의 이름을 바꾸면 묶인 줄 높이와 글자 사이도 따라간다.
    // 의미 글꼴도 뒤에 붙은 글자 사이 값이 따라간다(직접 정해 둔 값이 이름을 잃지 않게).
    const pair: Record<string, string> = SIZE.matches(from) || STYLE.matches(from)
      ? { [from]: to, [lineName(from)]: lineName(to), [trackName(from)]: trackName(to) }
      : { [from]: to }
    commit(followTypeRefs(followRefs(tokens.map((t) => (pair[t.name] ? { ...t, name: pair[t.name] } : t)), { [from]: to }), pair))
    setSelected([to])
    // 이 값을 가리키던 컴포넌트도 새 이름을 따라가게 한다.
    if (JSON.stringify(comps).includes(`"${from}"`)) commitComps(renameRef(comps, from, to))
  }

  /** 토대(크기, 간격, 모서리)의 길이를 바꾼다. 이름이 px 숫자 그대로라서 이름도 함께 바뀌고, 그것을 가리키던 의미 값이 새 이름을 따라간다. */
  function changeLength(from: string, to: string, value: string) {
    commit(followRefs(tokens.map((t) => (t.name === from ? { ...t, name: to, value } : t)), { [from]: to }))
    setSelected([to])
    if (JSON.stringify(comps).includes(`"${from}"`)) commitComps(renameRef(comps, from, to))
  }

  /** 여러 값의 이름을 한 번에 바꾼다. 그 값을 가리키던 컴포넌트도 새 이름을 따라간다. */
  function renameMany(renames: Record<string, string>) {
    setBatch(false)
    const pairs = { ...renames }
    for (const [from, to] of Object.entries(renames)) {
      if (!SIZE.matches(from) && !STYLE.matches(from)) continue
      pairs[lineName(from)] = lineName(to)
      pairs[trackName(from)] = trackName(to)
    }
    commit(followTypeRefs(followRefs(tokens.map((t) => (pairs[t.name] ? { ...t, name: pairs[t.name] } : t)), renames), pairs))
    // 이름이 서로 맞바뀌어도 꼬이지 않도록 한 번에 훑으며 바꾼다.
    const next: Comp[] = JSON.parse(JSON.stringify(comps), (_, v) => (typeof v === 'string' && renames[v] ? renames[v] : v))
    if (JSON.stringify(next) !== JSON.stringify(comps)) commitComps(normalize(next))
    select(selected.map((name) => renames[name] ?? name))
  }

  /** 색 이름에서 목록과 단계를 읽는다. primary-500처럼 목록에 속하고 단계가 50~950 중 하나일 때만 값이 있다. */
  function scaleOf(name: string) {
    if (!COLOR.matches(name)) return null
    const short = shortName(COLOR, name)
    const group = groupOf(short)
    const step = Number(short.slice(group.length + 1))
    if (!group || !SCALE_STEPS.includes(step)) return null
    const inGroup = (t: Token) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === group
    const have = new Set(tokens.filter(inGroup).map((t) => shortName(COLOR, t.name).slice(group.length + 1)))
    return { group, step, inGroup, missing: SCALE_STEPS.filter((s) => !have.has(String(s))) }
  }

  /**
   * 고른 색을 기준으로 같은 목록에 50~950 단계를 채우고, 목록을 번호 순서로 놓는다.
   * 빈 단계가 있으면 그것만 채우고 이미 있는 단계는 그대로 둔다.
   * 단계가 이미 다 있으면 "다시 생성"이다. 기준 색만 두고 나머지 단계의 색을 모두 새로 계산한 색으로 바꾼다.
   */
  function fillScale(name: string) {
    const scale = scaleOf(name)
    const base = tokens.find((t) => t.name === name)
    const hex = base ? toHex(base.value) : null
    // 기준은 불투명한 색이어야 한다.
    if (!scale || hex?.length !== 7) return
    const colors = makeScale(hex, scale.step)
    const made = scale.missing.map((s) => ({ name: `${COLOR.prefix}${scale.group}-${s}`, value: toOklch(colors[s]) }))
    const again = scale.missing.length === 0
    // 다시 생성할 때 바꿀 값: 기준 색이 아니고 이름이 50~950인 것.
    const renew = (t: Token) => {
      const s = Number(shortName(COLOR, t.name).slice(scale.group.length + 1))
      return again && t.name !== name && SCALE_STEPS.includes(s) ? { ...t, value: toOklch(colors[s]) } : t
    }
    // 번호가 아닌 이름(primary-main 등)은 맨 뒤에 둔다.
    const order = (t: Token) => {
      const n = Number(shortName(COLOR, t.name).slice(scale.group.length + 1))
      return Number.isFinite(n) ? n : Infinity
    }
    const list = [...tokens.filter(scale.inGroup).map(renew), ...made].sort((a, b) => order(a) - order(b))
    const first = tokens.findIndex(scale.inGroup)
    const rest = tokens.filter((t) => !scale.inGroup(t))
    const before = tokens.slice(0, first).filter((t) => !scale.inGroup(t)).length
    commit([...rest.slice(0, before), ...list, ...rest.slice(before)])
    select(list.map((t) => t.name))
  }

  /** 예외 색을 만든다. 다른 예외 색들 뒤에, 없으면 색들의 맨 뒤에 놓는다. */
  function addSolo(name: string, value: string) {
    setAddingSolo(false)
    const solo = (t: Token) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === ''
    insert({ name: COLOR.prefix + name, value }, tokens.some(solo) ? solo : (t) => COLOR.matches(t.name))
  }

  /**
   * 색 목록을 통째로 한 칸 아래(1)나 위(-1)로 옮긴다. 목록의 순서는 파일에 색이 적힌 순서다.
   * 색들을 목록별로 모아 순서를 바꾼 뒤, 원래 색이 있던 자리들에 차례로 다시 채운다.
   */
  function moveGroup(group: string, dir: 1 | -1) {
    const order = groupOrder()
    const i = order.indexOf(group)
    const j = i + dir
    if (i === -1 || j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    setGroupOrder(order)
  }

  /** 색 목록을 끌어서 놓았다. before 앞으로(맨 끝이면 null) 옮긴다. */
  function reorderGroup(group: string, before: string | null) {
    const order = groupOrder().filter((g) => g !== group)
    const at = before === null ? order.length : order.indexOf(before)
    // 자기 자신 앞에 놓은 것은 제자리다.
    if (before === group || at === -1) return
    order.splice(at, 0, group)
    setGroupOrder(order)
  }

  /** 지금 색 목록들의 순서. 파일에 색이 적힌 순서다. */
  function groupOrder() {
    // 예외 색 목록('')도 색이 있으면 다른 목록과 같이 차례에 낀다.
    return [...new Set(tokens.filter((t) => COLOR.matches(t.name)).map((t) => groupOf(shortName(COLOR, t.name))))]
  }

  /** 색 목록의 순서를 바꾼다. 색들을 목록별로 모아 새 순서로 늘어놓고, 원래 색이 있던 자리들에 차례로 다시 채운다. */
  function setGroupOrder(order: string[]) {
    if (order.join('\n') === groupOrder().join('\n')) return
    const colors = tokens.filter((t) => COLOR.matches(t.name))
    const sorted = order.flatMap((g) => colors.filter((t) => groupOf(shortName(COLOR, t.name)) === g))
    let k = 0
    commit(tokens.map((t) => (COLOR.matches(t.name) ? sorted[k++] : t)))
  }

  function removeTokens(names: string[]) {
    // 글자 크기를 지우면 묶인 줄 높이와 글자 사이도 함께 지운다.
    const gone = new Set([...names, ...names.filter((n) => SIZE.matches(n)).flatMap(boundNames)])
    const rest = tokens.filter((t) => !gone.has(t.name))
    // 색을 하나씩 지우다가 목록이 비면 목록은 빈 채로 남겨 둔다(다시 채울 수 있게).
    // 한 번에 색을 둘 이상 지워서 비운 것은 목록을 통째로 지우려는 것이므로 목록도 함께 없앤다.
    const groupName = (name: string) => (COLOR.matches(name) ? groupOf(shortName(COLOR, name)) : '')
    const emptied = [...new Set(names.map(groupName))].filter(
      (g) =>
        g &&
        !keptGroups.includes(g) &&
        !rest.some((t) => groupName(t.name) === g) &&
        names.filter((n) => groupName(n) === g).length === 1,
    )
    // 빈 목록은 저장하기 전에 센다. 저장하고 나면 지운 의미 색(text-muted)이 더는 의미 색으로 가려지지 않아, 단계 색으로 읽혀 text라는 빈 목록이 생긴다.
    commit(rest)
    if (emptied.length) saveBoards(boards, images, [...keptGroups, ...emptied])
    select([])
    setConfirm(null)
  }

  /** 값을 지운다. 컴포넌트가 쓰고 있는 값이 섞여 있을 때만 먼저 묻고, 아니면 바로 지운다(되돌리기로 살릴 수 있다). */
  function askRemoveTokens(names: string[]) {
    // 함께 지우는 의미 색은 빼고, 남는 의미 색 가운데 이 값을 가리키는 것들.
    // 이 값을 가리키는 의미 글꼴도 함께 센다.
    const rolesOf = (n: string) => [
      ...tokens.filter((t) => !names.includes(t.name) && refOf(t.value) === n).map((t) => shortName(ROLE, t.name)),
      ...typeUsers(tokens, n)
        .filter((u) => !names.includes(u))
        .map((u) => shortName(STYLE, u)),
      // 이 이징을 가리키는 애니메이션도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && KINDS.animate.matches(t.name) && easeRefsIn(t.value).includes(n)).map((t) => shortName(KINDS.animate, t.name)),
      // 이 색을 가리키는 그라데이션도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && KINDS.gradient.matches(t.name) && colorRefsIn(t.value).includes(n)).map((t) => shortName(KINDS.gradient, t.name)),
      // 이 색을 가리키는 그림자도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && KINDS.shadow.matches(t.name) && shadowRefs(t.value).includes(n)).map((t) => shortName(KINDS.shadow, t.name)),
      // 이 간격을 가리키는 의미 간격도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && KINDS.spaceUse.matches(t.name) && SPACE_REF.exec(t.value)?.[1] === n).map((t) => shortName(KINDS.spaceUse, t.name)),
      // 이 크기를 가리키는 의미 크기(높이, 폭, 정사각형)도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && LENGTH_REF.exec(t.value)?.[1] === n).map((t) => shortName(kindOf(t.name) ?? KINDS.height, t.name)),
      // 이 모서리를 가리키는 의미 모서리도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && KINDS.radius.matches(t.name) && CORNER_REF.exec(t.value)?.[1] === n).map((t) => shortName(KINDS.radius, t.name)),
      // 이 굵기를 가리키는 의미 테두리(테두리 선, 외곽선)도 함께 센다.
      ...tokens.filter((t) => !names.includes(t.name) && THICKNESS_REF.exec(t.value)?.[1] === n).map((t) => shortName(kindOf(t.name) ?? KINDS.border, t.name)),
    ]
    const used = names.filter((n) => usesOf(comps, n).length > 0 || rolesOf(n).length > 0)
    if (used.length === 0) return removeTokens(names)
    const users = [...new Set(used.flatMap((n) => [...usesOf(comps, n).map((u) => u.name), ...rolesOf(n)]))]
    const kind = ALL_KINDS.find((k) => k.matches(used[0]))
    setConfirm({
      title: used.length === 1 ? '쓰고 있는 값이에요' : `쓰고 있는 값이 ${used.length}개 있어요`,
      body: (
        <>
          <span className="type-label text-ink">{users.join(', ')}</span>에서{' '}
          {used.length === 1 ? (
            <>
              <span className="type-label text-ink">{kind ? lengthLabel(kind, used[0]) : used[0]}</span> 값을
            </>
          ) : (
            '이 값들을'
          )}{' '}
          쓰고 있어요. 지우면 그 자리는 비게 돼요.
        </>
      ),
      run: () => removeTokens(names),
    })
  }

  /** 판의 자리나 너비를 바꾼다. 적지 않은 값은 그대로 둔다. */
  function moveBoards(moved: Record<string, Partial<Pos>>) {
    if (!system) return
    record()
    const next = { ...boards }
    const nextImages = { ...images }
    for (const [id, raw] of Object.entries(moved)) {
      // 어떤 길로 옮기든(끌기, 정렬, 간격 맞춤, 패널의 숫자) 자리와 너비는 정수 px에 맞춘다.
      const patch = { ...raw }
      for (const key of ['x', 'y', 'w'] as const) if (patch[key] !== undefined) patch[key] = Math.round(patch[key]!)
      const image = images[id]
      if (image) {
        // 글은 자리만 바뀐다. 크기는 내용과 글자 크기가 정한다.
        if (image.text !== undefined) {
          nextImages[id] = { ...image, x: patch.x ?? image.x, y: patch.y ?? image.y }
          continue
        }
        // 사진은 자리와 너비만 바뀐다. 높이는 비율대로 따라온다.
        const w = patch.w ?? image.w
        nextImages[id] = { ...image, x: patch.x ?? image.x, y: patch.y ?? image.y, w, h: Math.round((image.h * w) / image.w) }
        continue
      }
      next[id] = { ...(boards[id] ?? boardPositions(boards)[id]), ...patch }
    }
    saveBoards(next, nextImages)
    // 숨긴 판은 선택에서 뺀다.
    const gone = Object.keys(moved).filter((id) => moved[id].hidden && !(id in images))
    if (gone.length) setSelectedBoards((ids) => ids.filter((id) => !gone.includes(id)))
  }

  function changeScreen(id: ScreenId) {
    setScreen(id)
    // 글 적기 상태는 화면을 옮기면 푼다. 캔버스가 없는 화면에 남으면 보이지 않는 상태가 Esc 한 번을 먹는다.
    setPlacingText(false)
    setFocusToken(null)
    // 숨겨 둔 판의 메뉴를 누르면 다시 보이게 한다.
    if (isTokenScreen(id) && boards[id]?.hidden) moveBoards({ [id]: { hidden: false } })
    // 같은 메뉴를 다시 눌러도 그 판으로 다시 이동하게 한다.
    setFocusNonce((n) => n + 1)
    // 기본 값 메뉴를 누르면 그 판을 선택한다. 오른쪽 패널이 함께 열리므로, 캔버스는 패널을 뺀 나머지의 가운데에 판을 맞춘다.
    setSelectedBoards(isTokenScreen(id) ? [id] : [])
    select([])
    setCells([])
  }

  /** 붙여넣은 사진을 파일로 저장하고, 지금 보고 있는 화면 가운데에 놓는다. */
  async function addImage(file: Blob) {
    if (!system) return
    try {
      const [saved, bitmap] = await Promise.all([uploadImage(system, file), createImageBitmap(file)])
      const scale = Math.min(1, PASTED_IMAGE_WIDTH / bitmap.width)
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      // 캔버스가 기억해 둔 보기 위치로 화면 가운데의 캔버스 좌표를 구한다.
      const main = document.querySelector('main')
      let view = { x: 48, y: 48, z: 1 }
      try {
        view = { ...view, ...JSON.parse(localStorage.getItem(`ff.view.${system}`) ?? '{}') }
      } catch {
        // 기억해 둔 위치가 없으면 기본 위치를 쓴다.
      }
      const cx = ((main?.clientWidth ?? 0) / 2 - view.x) / view.z
      const cy = ((main?.clientHeight ?? 0) / 2 - view.y) / view.z
      const id = `img-${Date.now().toString(36)}`
      record()
      saveBoards(latest.current.boards, {
        ...latest.current.images,
        [id]: { file: saved.file, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h },
      })
      select([])
      setSelectedBoards([id])
    } catch (e) {
      notify(e instanceof Error && e.message ? e.message : '사진을 넣지 못했어요.')
    }
  }

  /** 캔버스에 적은 글을 저장한다. id가 null이면 새 글이다. 내용이 비었으면 새 글은 만들지 않고, 있던 글은 지운다. */
  function saveNote(id: string | null, note: { text: string; x: number; y: number; w: number; h: number }) {
    // 끝의 빈 줄과 빈칸은 버린다. 글 상자가 보이지 않는 빈 줄만큼 커지지 않게 한다.
    // 붙여 넣은 긴 글도 서버가 받는 길이에서 자른다(칸의 maxLength를 지나쳐 온 것에 대비한다).
    const text = note.text.replace(/\s+$/, '').slice(0, NOTE_LIMIT)
    if (id === null) {
      if (!text) return
      const made = `img-${Date.now().toString(36)}`
      record()
      saveBoards(latest.current.boards, { ...latest.current.images, [made]: { text, x: note.x, y: note.y, w: note.w, h: note.h } })
      select([])
      return setSelectedBoards([made])
    }
    const old = images[id]
    if (!old) return
    if (!text) return removeImages([id])
    // 고치지 않았으면 저장하지 않는다.
    if (text === old.text) return
    record()
    saveBoards(boards, { ...images, [id]: { ...old, text, w: note.w, h: note.h } })
  }

  /** 선택한 글들의 글자 크기를 바꾼다. 붙기와 정렬에 쓰는 크기(w, h)는 글자 크기와 줄 높이의 비율대로 맞춘다. */
  function sizeNotes(ids: string[], size: NoteSize) {
    const of = (id?: NoteSize) => NOTE_SIZES.find((s) => s.id === (id ?? 'md'))!
    const next = { ...images }
    for (const id of ids) {
      const note = images[id]
      if (note?.text === undefined || (note.size ?? 'md') === size) continue
      next[id] = { ...note, size, w: Math.round((note.w * of(size).font) / of(note.size).font), h: Math.round((note.h * of(size).line) / of(note.size).line) }
    }
    record()
    saveBoards(boards, next)
  }

  /** 캔버스에서 사진을 뺀다. 파일은 남겨 두어 되돌리기로 살릴 수 있다. */
  function removeImages(ids: string[]) {
    record()
    saveBoards(boards, Object.fromEntries(Object.entries(images).filter(([id]) => !ids.includes(id))))
    setSelectedBoards((picked) => picked.filter((id) => !ids.includes(id)))
  }

  /** 지금 있는 자리. 어느 화면에서 무엇을 골라 두었는지. */
  const here = (): Place => ({ screen, selected, boards: selectedBoards, compIndex, cells })

  /** 건너뛰기 직전에 부른다. 떠나는 자리를 뒤로 갈 곳으로 쌓고, 앞으로 갈 곳은 비운다(브라우저의 뒤로·앞으로와 같다). 쉰 곳까지 기억한다. */
  function leave() {
    setTrail((t) => ({ back: [...t.back, here()].slice(-50), forward: [] }))
  }

  /** 뒤로(-1)나 앞으로(1) 한 자리 간다. 그 자리에서 골라 두었던 것이 다시 골라지고, 값 하나였으면 화면 가운데로 온다. 그 사이에 지워진 값은 고르지 않는다. */
  function walk(dir: -1 | 1) {
    const to = (dir === -1 ? trail.back : trail.forward).at(-1)
    if (!to) return
    setTrail(dir === -1 ? { back: trail.back.slice(0, -1), forward: [...trail.forward, here()] } : { back: [...trail.back, here()], forward: trail.forward.slice(0, -1) })
    const names = to.selected.filter((n) => tokens.some((t) => t.name === n))
    if (isTokenScreen(to.screen) && boards[to.screen]?.hidden) moveBoards({ [to.screen]: { hidden: false } })
    setScreen(to.screen)
    setCompIndex(Math.min(to.compIndex, Math.max(0, comps.length - 1)))
    setSelectedBoards(to.boards)
    select(names)
    setCells(to.cells)
    setFocusToken(names.length === 1 ? names[0] : null)
    setFocusNonce((n) => n + 1)
  }

  /** 값 하나를 선택하고 그 값이 화면 가운데에 오게 이동한다. */
  function goToken(name: string) {
    const id = TOKEN_SCREEN_IDS.find((s) => TOKEN_SCREENS[s].kinds.some((k) => k.matches(name)))
    if (!id) return
    leave()
    if (boards[id]?.hidden) moveBoards({ [id]: { hidden: false } })
    setScreen(id)
    setSelectedBoards([])
    setCells([])
    select([name])
    setFocusToken(name)
    setFocusNonce((n) => n + 1)
  }

  // 컴포넌트
  const comp = comps[compIndex] ?? null

  function openComp(index: number) {
    leave()
    setScreen('components')
    setCompIndex(index)
    setSelectedBoards([])
    select([])
    setCells([])
  }

  /** 이름 바꾸기(더블클릭, Ctrl+R): 오른쪽 패널의 이름 칸으로 커서를 옮긴다. 패널을 숨겨 두었으면 다시 보인다. */
  function askRename(what: 'token' | 'variant' | 'size' | 'group') {
    setBare(false)
    setRenameAsk((ask) => ({ what, n: (ask?.n ?? 0) + 1 }))
  }

  /** 순서를 바꾼 결과를 저장한다. 끌었다가 제자리에 놓은 것처럼 순서가 그대로면 저장하지 않는다(빈 되돌리기 단계가 생기지 않게). */
  function commitIfMoved(next: Token[]) {
    if (next.some((t, i) => t.name !== tokens[i]?.name)) commit(next)
  }

  /** 색 목록의 이름을 통째로 바꾼다. 그 목록의 색이 모두 새 이름을 따라간다. 바꿀 수 없으면 이유를 돌려준다. */
  function renameGroup(from: string, to: string): string | null {
    if (!SLUG.test(to)) return slugMessage(to)
    if (groupTaken.has(to)) return takenWhy(to)
    const head = `${COLOR.prefix}${from}-`
    // 그 목록의 단계 색만 따라간다. 이름이 같은 말로 시작하는 의미 색(primary-hover)은 목록에 속하지 않는다.
    const moved = Object.fromEntries(
      tokens
        .filter((t) => COLOR.matches(t.name) && t.name.startsWith(head) && groupOf(shortName(COLOR, t.name)) === from)
        .map((t) => [t.name, `${COLOR.prefix}${to}-${t.name.slice(head.length)}`]),
    )
    if (Object.values(moved).some((name) => tokens.some((t) => t.name === name))) return '같은 이름이 이미 있어요.'
    renameMany(moved)
    // 색이 하나뿐인 목록을 목록으로 선택해 둔 것이면, 이름을 바꾼 뒤에도 목록을 선택한 채로 둔다(색이 여럿인 목록과 같다).
    if (listPicked === from) setListPicked(to)
    return null
  }

  function renameTokenInPanel(name: string) {
    if (selected.length !== 1 || selected[0] !== name) select([name])
    askRename('token')
  }

  /** 종류나 크기의 이름을 더블클릭하면 그 종류(크기)의 칸 하나를 선택하고 패널의 이름 칸으로 간다. */
  function renamePartInPanel(part: 'variants' | 'sizes', index: number) {
    const last = cells.at(-1)
    const cell: Cell = part === 'variants' ? { v: index, s: last?.s ?? 0, state: 'default' } : { v: last?.v ?? 0, s: index, state: 'default' }
    if (cells.length !== 1 || (part === 'variants' ? last?.v !== index : last?.s !== index)) selectCells([cell])
    askRename(part === 'variants' ? 'variant' : 'size')
  }

  function duplicateVariant(index: number) {
    if (!comp) return
    const name = freshName(comp.variants.map((v) => v.name), `${comp.variants[index].name}-copy`)
    const variants = [...comp.variants]
    variants.splice(index + 1, 0, cloneVariant(comp.variants[index], name))
    changeComp({ ...comp, variants })
    selectCells([{ v: index + 1, s: cells.at(-1)?.s ?? 0, state: 'default' }])
  }

  function duplicateSize(index: number) {
    if (!comp) return
    const name = freshName(comp.sizes.map((s) => s.name), `${comp.sizes[index].name}-copy`)
    const sizes = [...comp.sizes]
    sizes.splice(index + 1, 0, { ...comp.sizes[index], name })
    changeComp({ ...comp, sizes })
    selectCells([{ v: cells.at(-1)?.v ?? 0, s: index + 1, state: 'default' }])
  }

  /** 이름이 곧 길이인 토대 값인지(--gutter-8, --length-32). 예전 이름의 간격(--spacing-md)은 이름이 길이가 아니라서 아니다. */
  const isLengthNamed = (name: string) => {
    const kind = kindOf(name)
    return !!kind && ['space', 'length', 'corner', 'thickness'].includes(kind.id) && /^\d+$/.test(shortName(kind, name))
  }

  /** Ctrl+D: 선택한 값(컴포넌트 화면에서는 선택한 칸의 종류)을 하나 더 만든다. */
  function duplicate() {
    if (screen === 'components') {
      const cell = cells.at(-1)
      if (cell) duplicateVariant(cell.v)
      return
    }
    if (selected.length === 0) return
    // 이름이 곧 길이인 토대 값(간격, 크기, 모서리, 테두리)은 같은 길이를 둘 수 없다. "추가" 창이 막는 것을 복제가 뚫지 않게 한다.
    if (selected.some(isLengthNamed)) return notify('같은 길이는 둘 수 없어서 복제하지 않았어요.')
    // 한 목록을 통째로 골랐으면(색이 둘 이상) 목록을 복제한다. 같은 목록에 copy가 끼어들지 않고 "이름-copy"라는 새 목록이 생긴다.
    if (movableGroup && selected.length > 1) {
      const head = `${COLOR.prefix}${movableGroup}-`
      const list = tokens.filter((t) => COLOR.matches(t.name) && t.name.startsWith(head) && groupOf(shortName(COLOR, t.name)) === movableGroup)
      const name = freshName([...groupTaken], `${movableGroup}-copy`)
      const copies = list.map((t) => ({ name: `${COLOR.prefix}${name}-${t.name.slice(head.length)}`, value: t.value }))
      const at = tokens.indexOf(list.at(-1)!) + 1
      commit([...tokens.slice(0, at), ...copies, ...tokens.slice(at)])
      return select(copies.map((t) => t.name))
    }
    const { next, added } = duplicateTokens(tokens, selected)
    commit(next)
    select(added)
  }

  /** Tab: 선택을 다음(1)이나 이전(-1) 항목으로 옮긴다. 옮겼으면 true. */
  function stepSelection(dir: 1 | -1) {
    if (screen === 'components') {
      const last = cells.at(-1)
      if (!comp || !last) return false
      const all = comp.variants.flatMap((_, v) => comp.sizes.flatMap((_, s) => STATES.map(({ id }) => ({ v, s, state: id }))))
      const i = all.findIndex((c) => c.v === last.v && c.s === last.s && c.state === last.state)
      selectCells([all[(i + dir + all.length) % all.length]])
      return true
    }
    const names = [...document.querySelectorAll<HTMLElement>('[data-token]')].map((n) => n.dataset.token!)
    const i = names.indexOf(selected.at(-1) ?? '')
    if (i === -1) return false
    select([names[(i + dir + names.length) % names.length]])
    return true
  }

  /** 스포이드(I): 화면에서 찍은 색을 선택한 색 값에, 색 값이 없으면 선택한 판의 채우기에 넣는다. */
  async function pickColor() {
    const names = selected.filter((n) => COLOR.matches(n))
    if (names.length === 0 && selectedBoards.length === 0) return notify('색 값이나 판을 먼저 선택해 주세요.')
    const Dropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
    if (!Dropper) return notify('이 브라우저에서는 화면에서 색을 찍을 수 없어요.')
    let hex: string
    try {
      hex = (await new Dropper().open()).sRGBHex.toLowerCase()
    } catch {
      return // Esc로 그만둔 경우
    }
    if (names.length) {
      commit(tokens.map((t) => (names.includes(t.name) ? { ...t, value: toOklch(hex) } : t)))
      setSelectionId((n) => n + 1)
    } else if (/^#[0-9a-f]{6}$/.test(hex)) {
      moveBoards(Object.fromEntries(selectedBoards.map((id) => [id, { fill: hex }])))
    }
  }

  // 복사와 붙여넣기. 클립보드에는 CSS 변수 선언 그대로 담아서, 다른 디자인 시스템이나 코드에도 붙일 수 있다.
  const onClip = useRef<(e: ClipboardEvent) => void>(() => {})
  onClip.current = (e) => {
    if (isTyping(e.target) || document.querySelector('[role="dialog"]') || !system) return
    if (screen !== 'canvas' && !isTokenScreen(screen)) return
    if (e.type === 'copy') {
      // 값에 딸린 것(글자 크기의 줄 높이와 글자 사이처럼 이름이 "값의 이름--…"인 것)도 함께 담는다. 복제(Ctrl+D)와 같다.
      const picked = tokens.filter((t) => selected.includes(t.name) || selected.some((n) => t.name.startsWith(n + '--')))
      // 화면의 글자를 긁어서 복사하는 중이면 그대로 둔다.
      if (picked.length === 0 || window.getSelection()?.toString()) return
      lastCopied.current = toCss(picked)
      e.clipboardData?.setData('text/plain', lastCopied.current)
      e.preventDefault()
      return notify(`값 ${picked.filter((t) => selected.includes(t.name)).length}개를 복사했어요.`)
    }
    // 사진을 붙이면 캔버스에 놓는다.
    const picture = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
    if (picture) {
      e.preventDefault()
      return void addImage(picture)
    }
    const text = e.clipboardData?.getData('text/plain') ?? ''
    const scan = scanCss(text)
    if (scan.tokens.length === 0 && scan.skipped.length === 0) return
    e.preventDefault()
    // 붙여넣은 색은 어떤 형식이든(#, rgb, hsl) oklch로 맞춰 들인다.
    const pasted = storeColors(scan.tokens)
    // 색 값을 선택해 둔 채 붙이면 그 색이 속한 목록으로 들어간다.
    const target = selected.findLast((n) => COLOR.matches(n))
    const into = target ? groupOf(shortName(COLOR, target)) : null
    const adoptable = storeColors(adoptColors(scan.skipped))
    const names = new Set(tokens.map((t) => t.name))
    const conflicts = [...pasted, ...adoptable].filter((t) => names.has(pasteName(t.name, into))).length
    // FF에서 복사한 것을 그대로 붙이는 것은 복제다. 그 밖에 정할 것이 없을 때도 바로 붙인다.
    if (text === lastCopied.current || (conflicts === 0 && scan.skipped.length === 0)) return paste(pasted, into, false)
    setPasting({ pasted, conflicts, skipped: scan.skipped, adoptable, into })
  }

  function paste(pasted: Token[], into: string | null, overwrite: boolean) {
    setPasting(null)
    const { next, added, replaced } = pasteTokens(tokens, pasted, into, overwrite)
    if (added.length === 0) return
    commit(next)
    select(added)
    notify(replaced ? `값 ${added.length}개를 붙여넣었어요. ${replaced}개는 덮어썼어요.` : `값 ${added.length}개를 붙여넣었어요.`)
  }

  useEffect(() => {
    const listen = (e: ClipboardEvent) => onClip.current(e)
    document.addEventListener('copy', listen)
    document.addEventListener('paste', listen)
    return () => {
      document.removeEventListener('copy', listen)
      document.removeEventListener('paste', listen)
    }
  }, [])

  function changeComp(next: Comp) {
    commitComps(comps.map((c, i) => (i === compIndex ? next : c)))
  }

  function addComp(name: string) {
    setAddingComp(false)
    commitComps([...comps, newComp(name)])
    setCompIndex(comps.length)
    selectCells([])
  }

  function addVariant() {
    if (!comp) return
    // 이름은 primary, secondary, ghost, danger의 순서로 붙는다.
    const name = nextVariantName(comp.variants.map((v) => v.name))
    changeComp({ ...comp, variants: [...comp.variants, newVariant(name)] })
    selectCells([{ v: comp.variants.length, s: 0, state: 'default' }])
  }

  function addSize() {
    if (!comp) return
    // 이름은 sm, md, lg, xl의 순서로 붙고, 값은 마지막 크기의 여백과 글자 크기를 한 단계씩 키운 것이다(더 큰 값이 없으면 그대로).
    const name = nextSizeName(comp.sizes.map((s) => s.name))
    const last = comp.sizes.at(-1)
    const size = { ...newSize(name), padX: stepUp(tokens, last?.padX), padY: stepUp(tokens, last?.padY), textSize: stepUp(tokens, last?.textSize), gap: last?.gap }
    changeComp({ ...comp, sizes: [...comp.sizes, size] })
    selectCells([{ v: cells.at(-1)?.v ?? 0, s: comp.sizes.length, state: 'default' }])
  }

  /** 종류, 크기, 컴포넌트는 묻지 않고 바로 지운다(되돌리기로 살릴 수 있다). */
  function removePart(run: () => void) {
    run()
    selectCells([])
  }

  /** 속성 복사(Ctrl+Alt+C): 선택한 것의 속성만 담는다. 값은 값, 판은 모양, 컴포넌트 칸은 색. */
  function copyProps() {
    const cell = cells.at(-1)
    if (screen === 'components') {
      if (!comp || !cell) return
      copied.current = { type: 'cell', colors: { ...comp.variants[cell.v].states[cell.state] } }
    } else if (selected.length) {
      const token = tokens.find((t) => t.name === selected.at(-1))
      const kind = token && kindOf(token.name)
      if (!token || !kind) return
      copied.current = { type: 'token', kind: kind.id, value: token.value }
    } else {
      const id = selectedBoards.find((b) => !(b in images))
      if (!id) return
      const { opacity, radius, fill, stroke, strokeWidth } = boards[id] ?? {}
      copied.current = { type: 'board', style: { opacity, radius, fill, stroke, strokeWidth } }
    }
    notify('속성을 복사했어요.')
  }

  /** 속성 붙여넣기(Ctrl+Alt+V): 담아 둔 속성을 선택한 것들에 입힌다. 이름과 자리는 바뀌지 않는다. */
  function pasteProps() {
    const clip = copied.current
    if (!clip) return
    if (clip.type === 'cell') {
      if (screen !== 'components' || !comp || cells.length === 0) return
      const variants = comp.variants.map((v, i) => {
        const states = { ...v.states }
        for (const c of cells) if (c.v === i) states[c.state] = { ...clip.colors }
        return { ...v, states }
      })
      changeComp({ ...comp, variants })
      return setSelectionId((n) => n + 1)
    }
    if (screen === 'components') return
    if (clip.type === 'token') {
      // 이름이 곧 길이인 토대 값(간격, 크기, 모서리, 테두리)에는 값을 입히지 않는다. 8px라는 이름에 16px이 들어가면 이름과 길이가 어긋난다.
      if (selected.some((name) => kindOf(name)?.id === clip.kind && isLengthNamed(name))) return notify('길이는 이름이 곧 값이라 속성을 붙여넣지 않았어요.')
      // 같은 종류의 값에만 입힌다(색은 색에, 간격은 간격에).
      const targets = selected.filter((name) => kindOf(name)?.id === clip.kind)
      // 아무 일도 일어나지 않으면 붙여넣기가 된 것인지 알 수 없다. 까닭을 알린다.
      if (targets.length === 0) return selected.length > 0 ? notify('복사한 속성과 종류가 달라서 붙여넣지 않았어요.') : undefined
      commit(tokens.map((t) => (targets.includes(t.name) ? { ...t, value: clip.value } : t)))
      return setSelectionId((n) => n + 1)
    }
    const targets = selectedBoards.filter((id) => !(id in images))
    if (targets.length) moveBoards(Object.fromEntries(targets.map((id) => [id, clip.style])))
  }

  function toggleBare() {
    if (!bare) notify('Ctrl+\\ 를 누르면 메뉴와 패널이 다시 보여요.')
    setBare(!bare)
  }

  // 단축키: Ctrl+Z 되돌리기, Ctrl+Shift+Z 다시 실행, Delete·Backspace 삭제, Esc 선택 풀기, Ctrl+A 모두 선택. 최신 상태를 보도록 매번 새 함수를 담아 둔다.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = (e) => {
    const mod = e.ctrlKey || e.metaKey
    const dialog = document.querySelector('[role="dialog"]')
    // 글자를 쓰는 중에도 되는 것: 빠른 실행(Ctrl+K), 단축키 목록(Ctrl+Shift+/), 메뉴와 패널 숨기기(Ctrl+\).
    if (mod && !e.altKey && !dialog) {
      const run = (action: () => void) => {
        e.preventDefault()
        action()
      }
      if (!e.shiftKey && (e.code === 'KeyK' || e.code === 'Slash')) return run(() => setPalette(true))
      if (e.shiftKey && e.code === 'Slash') return run(() => setHelp(true))
      if (!e.shiftKey && e.code === 'Backslash') return run(toggleBare)
    }
    // Ctrl+R은 새로 고침으로 쓰지 않는다(실수로 눌러도 화면이 다시 불리지 않게). 하나를 선택했으면 이름 바꾸기다.
    if (mod && !e.altKey && e.code === 'KeyR') {
      e.preventDefault()
      if (e.shiftKey || dialog) return
      if (screen === 'components') {
        if (cells.length) renamePartInPanel('variants', cells.at(-1)!.v)
      } else if (selected.length === 1) {
        // 색이 하나뿐인 목록을 목록 이름으로 골라 두었으면 떠 있는 것이 목록 패널이다. 그 패널의 목록 이름 칸으로 간다.
        if (listPicked) askRename('group')
        else renameTokenInPanel(selected[0])
      } else if (stepColorsPicked) setBatch(true)
      return
    }
    if (isTyping(e.target) || dialog) return

    // Alt+← / Alt+→: 지나온 자리로 뒤로, 앞으로(브라우저와 같다).
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
      e.preventDefault()
      return walk(e.code === 'ArrowLeft' ? -1 : 1)
    }

    // Ctrl+Alt+C / V: 속성 복사와 붙여넣기(피그마와 같다).
    if (mod && e.altKey && !e.shiftKey && (e.code === 'KeyC' || e.code === 'KeyV')) {
      e.preventDefault()
      return e.code === 'KeyC' ? copyProps() : pasteProps()
    }

    if (mod && !e.altKey && (e.code === 'KeyZ' || e.code === 'KeyY')) {
      e.preventDefault()
      const { undo, redo } = history.current
      // Ctrl+Z 되돌리기, Ctrl+Shift+Z(또는 Ctrl+Y) 다시 실행.
      if (e.code === 'KeyY' || e.shiftKey) travel(redo, undo)
      else travel(undo, redo)
    } else if (e.code === 'Escape') {
      if (placingText) return setPlacingText(false)
      if (selected.length || pickedGroup) select([])
      if (cells.length) selectCells([])
    } else if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyD') {
      e.preventDefault()
      duplicate()
    } else if (
      (mod && !e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft')) ||
      // 값이나 분류를 고른 채의 그냥 방향키도 같은 일을 한다(↓→는 뒤로, ↑←는 앞으로). 판을 고른 채의 방향키는 캔버스가 판을 옮기는 데 쓰는데, 판과 값은 함께 골라지지 않아 겹치지 않는다.
      // 패널의 고르는 칸이 이미 받은 방향키(defaultPrevented)는 건드리지 않는다.
      (!mod && !e.altKey && !e.shiftKey && !e.defaultPrevented && (e.code === 'ArrowDown' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowLeft'))
    ) {
      if (screen === 'components' || selected.length === 0) return
      e.preventDefault()
      const dir = e.code === 'BracketRight' || e.code === 'ArrowDown' || e.code === 'ArrowRight' ? 1 : -1
      // 끌어서 옮길 수 있는 것은 단축키로도 옮긴다. 분류를 통째로(그리고 그것만) 골랐으면 그 분류를, 아니면 고른 값을 분류 안에서 옮긴다.
      // 분류의 제목을 누르면 그 분류가 통째로 골라지므로, 제목을 누르고 단축키를 누르면 분류가 옮겨진다.
      const picked = new Set(selected)
      const whole = (items: Token[]) => items.length > 0 && items.length === picked.size && items.every((t) => picked.has(t.name))
      const roleGroup = roleGroups(tokens).find((g) => whole(g.items))
      const typeGroup = typeGroups(tokens).find((g) => whole(g.items))
      const spaceUses = tokens.filter((t) => KINDS.spaceUse.matches(t.name))
      const spaceGroup = spaceUseOrder(tokens).find((u) => whole(spaceUses.filter((t) => readSpaceNote(t.note, shortName(KINDS.spaceUse, t.name)).use === u)))
      // 종류가 여럿인 판에서 한 종류의 값을 통째로 골랐으면 그 종류를 옮긴다.
      const board = TOKEN_SCREEN_IDS.map((id) => TOKEN_SCREENS[id].kinds).find((kinds) => kinds.length > 1 && kinds.some((k) => whole(tokens.filter((t) => k.matches(t.name)))))
      const wholeKind = board?.find((k) => whole(tokens.filter((t) => k.matches(t.name))))
      // 의미 크기의 분류를 통째로 골랐으면 그 분류를 옮긴다. 판의 분류는 높이·너비·정사각형에 걸쳐 있다.
      const sizes = tokens.filter((t) => [KINDS.height, KINDS.width, KINDS.square].some((k) => k.matches(t.name)))
      const sizeKindOf = (t: Token) => [KINDS.height, KINDS.width, KINDS.square].find((k) => k.matches(t.name))!
      const sizeGroup = sizeBoardGroupOrder(tokens).find((g) => whole(sizes.filter((t) => readSizeNote(t.note, shortName(sizeKindOf(t), t.name)).group === g)))
      // 의미 모서리의 분류(컨트롤, 컨테이너, 표시)을 통째로 골랐으면 그 분류를 옮긴다.
      const radii = tokens.filter((t) => KINDS.radius.matches(t.name))
      const radiusGroup = radiusGroupOrder(tokens).find((g) => whole(radii.filter((t) => readRadiusNote(t.note, shortName(KINDS.radius, t.name)).group === g)))
      const BORDER_KINDS = [KINDS.border, KINDS.outline]
      const borderKind = BORDER_KINDS.find((k) => borderGroupOrder(tokens, k).some((g) => whole(tokens.filter((t) => borderGroupOf(k, t) === g))))
      const borderGroup = borderKind && borderGroupOrder(tokens, borderKind).find((g) => whole(tokens.filter((t) => borderGroupOf(borderKind, t) === g)))
      if (movableGroup !== null) moveGroup(movableGroup, dir)
      else if (roleGroup) {
        const before = stepBefore(roleGroups(tokens).map((g) => g.use), roleGroup.use, dir)
        if (before !== undefined) commitIfMoved(moveRoleGroup(tokens, roleGroup.use, before))
      } else if (typeGroup) {
        const before = stepBefore(typeGroups(tokens).map((g) => g.use), typeGroup.use, dir)
        if (before !== undefined) commitIfMoved(moveTypeGroup(tokens, typeGroup.use, before))
      } else if (spaceGroup) {
        const before = stepBefore(spaceUseOrder(tokens), spaceGroup, dir)
        if (before !== undefined) commitIfMoved(moveSpaceGroup(tokens, spaceGroup, before))
      } else if (sizeGroup) {
        const before = stepBefore(sizeBoardGroupOrder(tokens), sizeGroup, dir)
        if (before !== undefined) commitIfMoved(moveSizeBoardGroup(tokens, sizeGroup, before))
      } else if (radiusGroup) {
        const before = stepBefore(radiusGroupOrder(tokens), radiusGroup, dir)
        if (before !== undefined) commitIfMoved(moveRadiusGroup(tokens, radiusGroup, before))
      } else if (borderKind && borderGroup && !BORDER_KINDS.some((k) => whole(tokens.filter((t) => k.matches(t.name))))) {
        const before = stepBefore(borderGroupOrder(tokens, borderKind), borderGroup, dir)
        if (before !== undefined) commitIfMoved(moveBorderGroup(tokens, borderKind, borderGroup, before))
      } else if (board && wholeKind) {
        const filled = orderKinds(tokens, board).filter((k) => tokens.some((t) => k.matches(t.name)))
        const before = stepBefore(filled, wholeKind, dir)
        if (before !== undefined) commitIfMoved(moveKind(tokens, board, wholeKind, before))
      }
      // 의미 색은 같은 역할 분류 안에서만 옮긴다(파일에서 이웃한 다른 분류의 색과 자리를 바꾸지 않는다).
      else if (selected.every((n) => ROLE.matches(n))) commitIfMoved(shiftRoles(tokens, selected, dir))
      // 의미 글꼴도 같은 분류 안에서만 옮긴다.
      else if (selected.every((n) => STYLE.matches(n))) commitIfMoved(shiftTypes(tokens, selected, dir))
      // 의미 간격도 같은 분류 안에서만 옮긴다.
      else if (selected.every((n) => KINDS.spaceUse.matches(n))) commitIfMoved(shiftSpaceUses(tokens, selected, dir))
      // 의미 크기(높이, 폭, 정사각형)도 같은 분류 안에서만 옮긴다.
      // 높이·너비·정사각형을 가리지 않고 같은 분류의 줄들 사이에서다. 하나를 골랐을 때만 옮긴다.
      else if (selectedTokens.length > 0 && selectedTokens.every((t) => sizeKindOf(t))) {
        if (selected.length === 1) commitIfMoved(shiftSizeInGroup(tokens, selected[0], dir))
      }
      // 의미 모서리도 같은 분류 안에서만 옮긴다.
      else if (selected.every((n) => KINDS.radius.matches(n))) commitIfMoved(shiftRadii(tokens, selected, dir))
      else if (commonKind && isBorderKind(commonKind)) commitIfMoved(shiftBorders(tokens, commonKind, selected, dir))
      // 차례가 값의 크기로 정해지는 값(글자 크기, 간격, 색 목록 안의 단계…)은 옮기지 않는다.
      else if (selectedTokens.some(isAutoOrdered)) return
      else commitIfMoved(shiftTokens(tokens, selected, dir))
    } else if (e.code === 'Tab' && !mod && !e.altKey) {
      // 패널 안의 고르는 칸이나 버튼에 초점이 있으면 Tab은 초점을 옮긴다. 선택을 옮기면 고치던 패널이 다른 값으로 바뀐다.
      if (e.target instanceof Element && e.target.closest('aside')) return
      if (stepSelection(e.shiftKey ? -1 : 1)) e.preventDefault()
    } else if (e.code === 'KeyI' && !mod && !e.altKey && !e.shiftKey) {
      if (screen !== 'components') pickColor()
    } else if (e.code === 'KeyT' && !mod && !e.altKey && !e.shiftKey) {
      // T: 글 적기. 캔버스가 보이는 화면에서만 듣는다. 다시 누르면 풀린다.
      if (screen === 'canvas' || isTokenScreen(screen)) setPlacingText((on) => !on)
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
      // 빈 색 목록을 선택했으면 그 목록을 지운다.
      if (pickedGroup && screen !== 'components') {
        e.preventDefault()
        record()
        saveBoards(boards, images, keptGroups.filter((g) => g !== pickedGroup))
        return setPickedGroup(null)
      }
      // 값을 선택하지 않았고 사진을 선택했으면 사진을 지운다(확인 창 없이, 되돌리기로 살릴 수 있다).
      const pictures = selectedBoards.filter((id) => id in images)
      if (screen !== 'components' && selected.length === 0 && pictures.length) {
        e.preventDefault()
        return removeImages(pictures)
      }
      if (screen === 'components' || selected.length === 0) return
      e.preventDefault()
      askRemoveTokens(selected)
    } else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyA') {
      e.preventDefault()
      if (screen === 'canvas') select(tokens.map((t) => t.name))
      else if (isTokenScreen(screen)) {
        // 선택한 값이 있으면 그 값이 있는 판의 값을 모두 선택한다. 왼쪽 메뉴에서 색상을 누른 뒤 글꼴 판의 값을 고르고 Ctrl+A를 눌렀을 때 색이 선택되면 안 된다.
        const home = selectedTokens[0] ? Object.values(TOKEN_SCREENS).find((s) => s.kinds.some((k) => k.matches(selectedTokens[0].name))) : null
        const kinds = (home ?? TOKEN_SCREENS[screen]).kinds
        select(tokens.filter((t) => kinds.some((k) => k.matches(t.name))).map((t) => t.name))
      } else if (screen === 'components' && comp) {
        selectCells(
          comp.variants.flatMap((_, v) => comp.sizes.flatMap((_, s) => STATES.map(({ id }) => ({ v, s, state: id })))),
        )
      }
    }
  }

  useEffect(() => {
    const listen = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener('keydown', listen)
    return () => window.removeEventListener('keydown', listen)
  }, [])

  /** 줄이 끌려 다닐 수 있는 범위. 종류와, 분류가 있는 종류는 그 분류다(끌기의 scopeOf와 같은 뜻). */
  const scopeOfToken = (t: Token) => {
    const kind = kindOf(t.name)
    if (!kind) return ''
    const short = shortName(kind, t.name)
    const group = ROLE.matches(t.name)
      ? roleGroups([t])[0]?.use
      : STYLE.matches(t.name)
        ? typeGroups([t])[0]?.use
        : KINDS.spaceUse.matches(t.name)
          ? readSpaceNote(t.note, short).use
          : isSizeKind(kind)
            ? readSizeNote(t.note, short).group
            : KINDS.radius.matches(t.name)
              ? readRadiusNote(t.note, short).group
              : isBorderKind(kind)
                ? borderGroupOf(kind, t)
                : ''
    return `${kind.id}:${group ?? ''}`
  }

  /**
   * 줄을 끌어 옮긴다. 여러 개를 선택하고 그 가운데 하나를 끌면 선택한 것이 모두 함께 옮겨진다(Ctrl+]/[와 같다). 선택하지 않은 줄을 끌면 그 줄만 옮겨진다.
   * 선택한 것을 파일에 적힌 차례대로 하나씩 놓일 자리 앞에 넣으므로 서로의 앞뒤는 그대로다. 놓일 자리가 선택한 것 가운데 하나면 잡은 줄만 옮긴다.
   */
  const moveTogether = (move: (list: Token[], name: string, before: string | null) => Token[], name: string, before: string | null) => {
    const many = selected.length > 1 && selected.includes(name) && (before === null || !selected.includes(before))
    // 잡은 줄과 같은 분류에 있는 것만 함께 옮긴다. 줄은 분류 밖으로 나가지 못하므로, 다른 분류의 것까지 같은 자리로 보내면 그 값이 제 분류의 끝으로 튄다.
    const held = tokens.find((t) => t.name === name)
    const scope = held ? scopeOfToken(held) : ''
    const names = many ? tokens.filter((t) => selected.includes(t.name) && scopeOfToken(t) === scope).map((t) => t.name) : [name]
    return names.reduce((list, n) => move(list, n, before), tokens)
  }

  const sectionProps = {
    tokens,
    selected,
    onSelect: pick,
    onAdd: addToken,
    onMakeSizes: () => setMakingSizes(true),
    onMakeWeights: () => setMakingWeights(true),
    onMakeTypes: () => setMakingTypes(true),
    onAddGroup: () => setAddingGroup(true),
    onRename: renameTokenInPanel,
    emptyGroups: keptGroups,
    folded,
    pickedGroup,
    onPickGroup: (group: string) => {
      setSelectedBoards([])
      select([])
      setPickedGroup(group)
    },
    onReorderGroup: reorderGroup,
    rolesFolded,
    onMoveRole: (name: string, before: string | null) => commitIfMoved(moveTogether(moveRole, name, before)),
    onMoveRoleGroup: (use: RoleUse, before: RoleUse | null) => commitIfMoved(moveRoleGroup(tokens, use, before)),
    onMoveType: (name: string, before: string | null) => commitIfMoved(moveTogether(moveType, name, before)),
    // 색상 판에서 끌어 옮기는 낱개 색은 예외 색뿐이다(목록 안의 단계는 숫자순으로 저절로 놓인다).
    onMoveInKind: (kind: Kind, name: string, before: string | null) =>
      commitIfMoved(moveTogether(kind.id === 'color' ? moveException : (list, n, b) => moveInKind(list, kind, n, b), name, before)),
    onMoveKind: (kinds: Kind[], kind: Kind, before: Kind | null) => commitIfMoved(moveKind(tokens, kinds, kind, before)),
    onMoveSpaceGroup: (use: SpaceUse, before: SpaceUse | null) => commitIfMoved(moveSpaceGroup(tokens, use, before)),
    onMoveRadiusGroup: (group: RadiusGroup, before: RadiusGroup | null) => commitIfMoved(moveRadiusGroup(tokens, group, before)),
    onMoveBorderGroup: (kind: Kind, group: BorderGroup, before: BorderGroup | null) => commitIfMoved(moveBorderGroup(tokens, kind, group, before)),
    resetOf: (kind: Kind) => {
      const next = defaultFreeOrder(tokens, kind)
      return next === tokens ? undefined : () => commit(next)
    },
    onMoveTypeGroup: (use: TypeUse, before: TypeUse | null) => commitIfMoved(moveTypeGroup(tokens, use, before)),
    // 의미 글꼴 판은 분류를 제목, 본문, 보조, 컨트롤, 숫자·코드 순서로, 분류 안은 큰 글자부터(같은 크기면 굵은 것부터) 놓는다. 이미 그 순서면 버튼이 꺼진다.
    onResetTypes: (() => {
      const next = defaultTypeOrder(tokens)
      return next.every((t, i) => t === tokens[i]) ? undefined : () => commit(next)
    })(),
    onSelectGroup: (names: string[], additive: boolean, rename: boolean, list?: string) => {
      setSelectedBoards([])
      select(additive ? [...selected, ...names.filter((n) => !selected.includes(n))] : names)
      // 색 목록의 이름을 눌러 그 목록만 선택한 것이면 기억해 둔다(select가 지운 뒤에 적는다).
      // Shift나 Ctrl을 누른 채 눌렀어도 다른 선택이 없었으면 그 목록만 고른 것이다.
      if (list && (!additive || selected.length === 0)) setListPicked(list)
      if (rename) askRename('group')
    },
  }

  const colorGroups = new Set([
    ...tokens.filter((t) => COLOR.matches(t.name)).map((t) => groupOf(shortName(COLOR, t.name))),
    ...keptGroups,
  ])
  /**
   * 새 목록이나 예외 색의 이름으로 쓸 수 없는 것들. 목록 이름, 색의 이름(의미 색 포함), 그리고 의미 색 이름의 앞머리(text-muted의 text)다.
   * 의미 색과 단계 색은 이름이 똑같이 --color-로 시작해서, 겹치면 같은 이름의 값이 둘이 되어 저장이 거절된다.
   */
  const groupTaken = new Set([
    ...colorGroups,
    ...tokens.filter((t) => t.name.startsWith(COLOR.prefix)).flatMap((t) => [t.name.slice(COLOR.prefix.length), groupOf(t.name.slice(COLOR.prefix.length))]),
  ])
  groupTaken.delete('')
  /** 그 이름을 왜 쓸 수 없는지. 화면에 그 이름이 안 보여도(의미 색 text-muted 때문에 text를 못 쓰는 경우) 무엇과 겹치는지 알 수 있게 적는다. */
  const takenWhy = (name: string) => {
    if (colorGroups.has(name)) return '같은 이름의 목록이 이미 있어요.'
    const same = tokens.find((t) => t.name === COLOR.prefix + name)
    // 이름 뒤에 조사를 붙이지 않는다. 영문 이름은 받침을 알 수 없어 "ink과"처럼 어색해진다.
    if (same) return ROLE.matches(same.name) ? `같은 이름의 의미 색(${name})이 이미 있어요.` : `같은 이름의 색(${name})이 이미 있어요.`
    const role = tokens.find((t) => ROLE.matches(t.name) && groupOf(t.name.slice(COLOR.prefix.length)) === name)
    if (role) return `이 이름으로 시작하는 의미 색(${role.name.slice(COLOR.prefix.length)})이 있어서 쓸 수 없어요.`
    return '같은 이름이 이미 있어요.'
  }
  /**
   * 패널에서 색의 목록과 이름을 고칠 때 쓸 수 없는 까닭. current는 지금의 짧은 이름(자기 자신과 겹치는 것은 문제가 아니다).
   * 이미 있는 목록으로 옮기는 것은 괜찮다. 막는 것은 둘이다.
   * 목록 없는 색(예외 색)의 이름이 목록 이름, 다른 색의 이름, 의미 색 이름의 앞머리와 겹칠 때. 예외 색 white를 gray로 바꾸면 목록 이름과 같은 예외 색이 생긴다.
   * 새 목록 이름(지금 없는 목록)이 색의 이름이나 의미 색 이름의 앞머리와 겹칠 때.
   */
  const colorNameProblem = (current: string, group: string, name: string) => {
    if (!group) return name !== current && groupTaken.has(name) ? { name: takenWhy(name) } : null
    if (colorGroups.has(group)) return null
    return groupTaken.has(group) ? { group: takenWhy(group) } : null
  }
  const selectedTokens = tokens.filter((t) => selected.includes(t.name))
  const selectedKinds = selectedTokens.map((t) => ALL_KINDS.find((k) => k.matches(t.name)) ?? null)
  const commonKind = selectedKinds.every((k) => k === selectedKinds[0]) ? (selectedKinds[0] ?? null) : null
  const ready = !loadError && systems !== null && system !== null
  // 번호 다시 매기기를 열 수 있는 선택. 색 목록의 단계 색만 둘 이상 골랐을 때다. 번호가 이름인 것은 단계 색(50~950)뿐이다.
  // 길이가 곧 이름인 값, 쓰임을 적은 의미 값, 단계 이름(xs, sm)에 번호를 매기면 이름이 망가진다.
  const stepColorsPicked = selectedTokens.length > 1 && selectedTokens.every((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) !== '')
  // 한 색 목록을 통째로(그리고 그것만) 선택했으면 그 목록의 이름. 오른쪽 패널에서 목록 이름을 고칠 수 있다.
  const groupsPicked = new Set(selectedTokens.map((t) => (COLOR.matches(t.name) ? groupOf(shortName(COLOR, t.name)) : null)))
  const onlyGroup = groupsPicked.size === 1 ? [...groupsPicked][0] : null
  // 색이 둘 이상이면 그 목록의 색을 빠짐없이 고른 것으로 안다. 색이 하나뿐인 목록은 목록 이름을 눌러 선택했을 때만이다(색을 누른 것이면 그 색의 패널이 뜬다).
  const wholeGroup =
    onlyGroup &&
    (selectedTokens.length > 1 || listPicked === onlyGroup) &&
    tokens.filter((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === onlyGroup).length === selectedTokens.length
      ? onlyGroup
      : null
  // Ctrl+]/[로 통째로 옮길 수 있는 목록. 한 목록의 색을 빠짐없이, 그것만 골랐을 때다.
  const movableGroup =
    onlyGroup !== null &&
    selectedTokens.length > 0 &&
    tokens.filter((t) => COLOR.matches(t.name) && groupOf(shortName(COLOR, t.name)) === onlyGroup).length === selectedTokens.length
      ? onlyGroup
      : null

  // 선택한 판들의 자리와 크기. 높이는 내용에 따라 정해지므로 화면에서 잰다.
  const pickedBoards: Placed[] =
    screen === 'canvas' || isTokenScreen(screen)
      ? selectedBoards.map((id) => {
          const image = images[id]
          if (image) return { id, x: image.x, y: image.y, w: image.w, h: image.h }
          const pos = boards[id] ?? boardPositions(boards)[id]
          const h = document.querySelector<HTMLElement>(`[data-board="${id}"]`)?.offsetHeight ?? 0
          return { id, x: pos.x, y: pos.y, w: defaultWidth(id), h }
        })
      : []

  // "원래대로": 판 안의 순서를 기본으로 돌려놓은 모습. 지금과 같으면 돌릴 것이 없으므로 null이다.
  // 색상 판은 회색 목록을 먼저, 색깔 있는 목록을 무지개 순서로 놓고, 목록 안의 색은 번호 순서(50→950)로 놓는다.
  const sameOrder = (next: Token[]) => next.every((t, i) => t === tokens[i])
  const colorsSorted = (() => {
    const next = defaultColorOrder(tokens)
    return sameOrder(next) ? null : next
  })()
  // 의미 색 판은 분류를 글자, 바탕, 테두리, 채움, 상태, 차트 순서로, 분류 안은 가리키는 색을 기준으로 놓는다(무채색 먼저).
  const rolesSorted = (() => {
    const next = defaultRoleOrder(tokens)
    return sameOrder(next) ? null : next
  })()

  // 빠른 실행에 나오는 것들: 화면, 컴포넌트, 값, 명령.
  const paletteItems: PaletteItem[] = !palette
    ? []
    : [
        { id: 's:canvas', group: '화면', label: '전체 보기', run: () => changeScreen('canvas') },
        ...TOKEN_SCREEN_IDS.map((id) => ({ id: `s:${id}`, group: '화면', label: TOKEN_SCREENS[id].title, run: () => changeScreen(id) })),
        ...comps.map((c, i) => ({ id: `c:${i}`, group: '화면', label: c.name, hint: '컴포넌트', run: () => openComp(i) })),
        { id: 'a:help', group: '명령', label: '단축키 목록', hint: 'Ctrl+Shift+/', run: () => setHelp(true) },
        { id: 'a:bare', group: '명령', label: bare ? '메뉴와 패널 보이기' : '메뉴와 패널 숨기기', hint: 'Ctrl+\\', run: toggleBare },
        { id: 'a:group', group: '명령', label: '색 목록 추가', run: () => setAddingGroup(true) },
        { id: 'a:role', group: '명령', label: '의미 색 추가', run: () => setAddingRole(true) },
        { id: 'a:solo', group: '명령', label: '예외 색 추가', run: () => setAddingSolo(true) },
        { id: 'a:font', group: '명령', label: '글꼴 종류 추가', run: () => setAddingFont(true) },
        { id: 'a:style', group: '명령', label: '의미 글꼴 추가', run: () => setAddingType(true) },
        { id: 'a:spaceuse', group: '명령', label: '의미 간격 추가', run: () => setAddingSpaceUse(true) },
        { id: 'a:space', group: '명령', label: '간격 추가', run: () => setAddingLength(KINDS.space) },
        { id: 'a:length', group: '명령', label: '크기 추가', run: () => setAddingLength(KINDS.length) },
        { id: 'a:sizeuse', group: '명령', label: '의미 크기 추가', run: () => setAddingSize(true) },
        { id: 'a:corner', group: '명령', label: '모서리 추가', run: () => setAddingLength(KINDS.corner) },
        { id: 'a:radius', group: '명령', label: '의미 모서리 추가', run: () => setAddingRadius(true) },
        { id: 'a:thickness', group: '명령', label: '테두리 추가', run: () => setAddingLength(KINDS.thickness) },
        ...[KINDS.border, KINDS.outline].map((kind) => ({ id: `a:${kind.id}`, group: '명령', label: kind.addLabel, run: () => setAddingBorder(kind) })),
        { id: 'a:shadow', group: '명령', label: '그림자 추가', run: () => setAddingEffect(KINDS.shadow) },
        { id: 'a:opacity', group: '명령', label: '투명도 추가', run: () => setAddingEffect(KINDS.opacity) },
        { id: 'a:blur', group: '명령', label: '흐림 추가', run: () => setAddingEffect(KINDS.blur) },
        { id: 'a:gradient', group: '명령', label: '그라데이션 추가', run: () => setAddingEffect(KINDS.gradient) },
        { id: 'a:z', group: '명령', label: '겹치는 순서 추가', run: () => setAddingLayer(true) },
        ...[KINDS.duration, KINDS.ease, KINDS.delay, KINDS.animate, KINDS.breakpoint, KINDS.container, KINDS.aspect].map((kind) => ({ id: `a:${kind.id}`, group: '명령', label: kind.addLabel, run: () => setAddingValue(kind) })),
        { id: 'a:sizes', group: '명령', label: '글자 크기 한 벌 만들기', run: () => setMakingSizes(true) },
        { id: 'a:weights', group: '명령', label: '굵기 한 벌 만들기', run: () => setMakingWeights(true) },
        { id: 'a:types', group: '명령', label: '의미 글꼴 한 벌 만들기', run: () => setMakingTypes(true) },
        { id: 'a:comp', group: '명령', label: '컴포넌트 추가', run: () => setAddingComp(true) },
        { id: 'a:system', group: '명령', label: '디자인 시스템 만들기', run: () => setCreating(true) },
        ...(systems ?? [])
          .filter((name) => name !== system)
          .map((name) => ({ id: `o:${name}`, group: '명령', label: `${name} 열기`, hint: '디자인 시스템', run: () => void openSystem(name) })),
        ...tokens.map((t) => {
          const kind = kindOf(t.name)
          return {
            id: `t:${t.name}`,
            group: '값',
            // 토대의 간격과 크기는 이름이 곧 길이라 한 번만 적는다(간격 · 8px). 옆에 값을 또 적지 않는다.
            label: kind ? `${kind.title} · ${lengthLabel(kind, t.name)}` : t.name,
            hint: COLOR.matches(t.name) ? showColor(t.value) : kind && lengthLabel(kind, t.name) === t.value ? undefined : t.value,
            search: t.name,
            run: () => goToken(t.name),
          }
        }),
      ]

  // "쓰인 모습" 견본의 글자에 쓸 글꼴. 글꼴 판에 값이 있으면 맨 앞의 것을 쓰고, 없으면 FF의 글꼴 그대로 둔다.
  const previewFont = tokens.find((t) => KINDS.font.matches(t.name))?.value
  // 그림(예시, 견본)에 깔아 줄 이 디자인 시스템의 간격과 크기. 값 목록이 바뀔 때만 다시 만든다.
  const previewSpace = useMemo(() => ({ ...spaceVars(tokens), ...sizeVars(tokens) }), [tokens])
  // 글꼴 견본이 따르는 값: 이 시스템의 글자 크기와 줄 높이(작은 것부터), 기본 글자색과 바탕색.
  const px = (value: string) => parseFloat(value) * (value.trim().endsWith('rem') ? 16 : 1)
  const around = surroundings(tokens)
  const baseInk = toHex(around.ink)?.slice(0, 7) ?? '#000000'
  const baseSurface = toHex(around.surface)?.slice(0, 7) ?? '#ffffff'
  const sampleLook = {
    sizes: tokens
      .filter((t) => SIZE.matches(t.name) && Number.isFinite(px(t.value)))
      .sort((a, b) => px(a.value) - px(b.value))
      .map((t) => ({ size: t.value, line: lineOf(tokens, t.name) ?? suggestLine(t.value) ?? 'normal' })),
    ink: baseInk,
    surface: baseSurface,
  }

  // 색 선택 창 아래에 견본으로 보여 줄, 이 디자인 시스템의 색들. 색상 판처럼 목록마다 한 줄이고, 예외 색은 맨 아래 줄이다.
  const swatchRows = new Map<string, { name: string; hex: string }[]>()
  for (const t of tokens) {
    const hex = COLOR.matches(t.name) ? toHex(t.value) : null
    if (!hex) continue
    const short = shortName(COLOR, t.name)
    const group = groupOf(short)
    swatchRows.set(group, [...(swatchRows.get(group) ?? []), { name: short, hex }])
  }
  const soloRow = swatchRows.get('')
  swatchRows.delete('')
  if (soloRow) swatchRows.set('', soloRow)
  const swatches = [...swatchRows].map(([group, colors]) => ({ group, colors }))

  return (
    <SwatchContext.Provider value={swatches}>
    <PreviewFontContext.Provider value={previewFont}>
    <PreviewSpaceContext.Provider value={previewSpace}>
    <SampleContext.Provider value={sampleLook}>
    <div className="flex h-full flex-col">
      {!bare && <TopBar
        systems={systems ?? []}
        current={system}
        status={status}
        saveError={saveError}
        onSelect={openSystem}
        onNew={() => setCreating(true)}
        onBack={trail.back.length ? () => walk(-1) : undefined}
        onForward={trail.forward.length ? () => walk(1) : undefined}
      />}

      <div className="flex min-h-0 flex-1">
        {!bare && <Nav
          hidden={TOKEN_SCREEN_IDS.filter((id) => boards[id]?.hidden)}
          locked={TOKEN_SCREEN_IDS.filter((id) => boards[id]?.locked)}
          onShow={(id) => moveBoards({ [id]: { hidden: false } })}
          onUnlock={(id) => moveBoards({ [id]: { locked: false } })}
          screen={screen}
          onSelect={changeScreen}
          components={comps.map((c) => c.name)}
          currentComponent={compIndex}
          onPickComponent={(index) => {
            setCompIndex(index)
            selectCells([])
          }}
          onAddComponent={() => setAddingComp(true)}
        />}

        {ready && (screen === 'canvas' || isTokenScreen(screen)) ? (
          <main
            className="min-w-0 flex-1"
            // 빈 목록의 이름이 아닌 곳을 누르면 빈 목록 선택을 푼다.
            onPointerDownCapture={(e) => {
              if (pickedGroup && !(e.target as HTMLElement).closest('[data-group-name]')) setPickedGroup(null)
            }}
          >
            {/* 캔버스는 하나다. 왼쪽 메뉴의 색상·글꼴 등을 누르면 같은 캔버스에서 그 판이 화면에 맞게 보이도록 이동한다. */}
            <Canvas
              key={system}
              viewKey={`ff.view.${system}`}
              focus={{ id: isTokenScreen(screen) ? screen : null, token: focusToken, nonce: focusNonce }}
              positions={boards}
              images={Object.entries(images).map(([id, image]) => ({ ...image, id, src: image.file ? imageUrl(system, image.file) : undefined }))}
              placing={placingText}
              onPlaced={() => setPlacingText(false)}
              onNote={saveNote}
              selectedItems={selected}
              onSelectItems={select}
              selectedBoards={selectedBoards}
              onSelectBoards={setSelectedBoards}
              onMove={moveBoards}
              boards={TOKEN_SCREEN_IDS.map((id) => ({
                id,
                title: TOKEN_SCREENS[id].title,
                content: (
                  <>
                    {id === 'color' && (
                      <div className="mb-header flex justify-end">
                        <AddColorButtons
                          onAddGroup={sectionProps.onAddGroup}
                          folded={folded}
                          onToggleFold={toggleFold}
                          reset={{ run: colorsSorted ? () => commit(colorsSorted) : undefined }}
                        />
                      </div>
                    )}
                    {id === 'role' && (
                      <div className="mb-header flex justify-end gap-actions-tight">
                        <ResetButton
                          title="역할과 그 안의 색을 처음 순서로 돌려놓아요"
                          onReset={rolesSorted ? () => commit(rolesSorted) : undefined}
                        />
                        <FoldButton folded={rolesFolded} title="설명과 예시를 모두 숨기거나 보여요" onToggle={toggleRolesFold} />
                        {/* 의미 색을 추가한다. 목록 끝의 점선 상자 대신, 색상 판의 "목록 추가"처럼 판 위에 둔다. */}
                        <Button variant="ghost" aria-label="의미 색 추가" onClick={() => setAddingRole(true)}>
                          <Plus size={16} strokeWidth={ICON_STROKE} />
                          추가
                        </Button>
                      </div>
                    )}
                    {/* 종류가 여럿인 판(글꼴, 효과, 화면 크기, 움직임)은 종류의 차례를 끌어서 바꿀 수 있다. 헝클어졌을 때 돌아갈 "원래대로"를 판 위에 하나 둔다. */}
                    {TOKEN_SCREENS[id].kinds.length > 1 &&
                      (() => {
                        // "원래대로"는 판마다 하나다. 종류의 차례와, 손으로 바꿀 수 있는 종류 안의 값의 차례를 한 번에 돌려놓는다.
                        const kinds = TOKEN_SCREENS[id].kinds
                        // 의미 크기는 세 종류의 값이 분류 안에서 한 줄로 이어져 있어서, 종류마다 따로 돌려놓지 않고 한 번에 놓는다.
                        const next = id === 'sizeuse' ? defaultSizeOrder(tokens) : kinds.filter(isFreeKind).reduce((list, kind) => defaultFreeOrder(list, kind), defaultKindOrder(tokens, kinds))
                        return (
                          <div className="mb-header flex justify-end gap-actions-tight">
                            <ResetButton title="종류와 그 안의 값을 처음 순서로 돌려놓아요" onReset={next === tokens ? undefined : () => commit(next)} />
                            {FOLDABLE.includes(id) && <FoldButton folded={!!plainBoards[id]} title="설명과 예시를 모두 숨기거나 보여요" onToggle={() => togglePlain(id)} />}
                            {/* 의미 크기는 종류가 셋이지만 추가는 판에 하나다. 종류는 창에서 고른다(다른 의미 판처럼 판마다 추가가 하나). */}
                            {id === 'sizeuse' && (
                              <Button variant="ghost" aria-label="의미 크기 추가" onClick={() => setAddingSize(true)}>
                                <Plus size={16} strokeWidth={ICON_STROKE} />
                                추가
                              </Button>
                            )}
                          </div>
                        )
                      })()}
                    {id === 'sizeuse' ? (
                      // 의미 크기 판. 높이·너비·정사각형으로 나누지 않고 분류 아래에 값을 한 줄씩 놓는다(의미 간격 판과 같은 짜임).
                      <DetailsFolded.Provider value={!!plainBoards[id]}>
                        <MissingNotices kinds={TOKEN_SCREENS[id].kinds} tokens={tokens} onSelect={sectionProps.onSelect} />
                        <SizeBoard
                          tokens={tokens}
                          selected={selected}
                          onSelect={sectionProps.onSelect}
                          onSelectGroup={sectionProps.onSelectGroup}
                          onRename={sectionProps.onRename}
                          onMove={(name, before) => commitIfMoved(moveTogether(moveSizeInGroup, name, before))}
                          onMoveGroup={(group, before) => commitIfMoved(moveSizeBoardGroup(tokens, group, before))}
                        />
                      </DetailsFolded.Provider>
                    ) : (
                      <KindSections kinds={TOKEN_SCREENS[id].kinds} {...sectionProps} {...(FOLDABLE.includes(id) ? { detailsFolded: !!plainBoards[id], onToggleDetails: () => togglePlain(id) } : {})} />
                    )}
                  </>
                ),
              }))}
            />
          </main>
        ) : (
          <main
            className="min-w-0 flex-1 overflow-y-auto bg-workspace p-board"
            onClick={(e) => {
              // 항목이나 버튼이 아닌 빈 곳을 누르면 선택을 푼다.
              if ((e.target as HTMLElement).closest('button, input, a, label')) return
              if (selected.length) select([])
              if (cells.length) selectCells([])
            }}
          >
            {loadError ? (
              <EmptyState title="불러오지 못했어요" body={loadError} />
            ) : systems === null ? null : !system ? (
              <div className="mx-auto mt-groups w-dialog rounded-float border-edge border-hairline bg-canvas p-dialog">
                <p className="mb-header type-title">첫 디자인 시스템을 만들어 보세요</p>
                <NewSystemForm
                  onCreated={(name) => {
                    setSystems((list) => [...(list ?? []), name].sort())
                    openSystem(name)
                  }}
                />
              </div>
            ) : isTokenScreen(screen) ? null : screen === 'components' ? (
              comp ? (
                <ComponentScreen
                  comp={comp}
                  tokens={tokens}
                  cells={cells}
                  onSelect={pickCell}
                  onAddVariant={addVariant}
                  onAddSize={addSize}
                  onRenameVariant={(index) => renamePartInPanel('variants', index)}
                  onRenameSize={(index) => renamePartInPanel('sizes', index)}
                />
              ) : (
                <div className="mx-auto max-w-(--width-page)">
                  <h1 className="mb-header flex h-control items-center type-title">컴포넌트</h1>
                  <div className="rounded-float border-edge border-hairline bg-canvas">
                    <EmptyState title="첫 컴포넌트를 만들어 보세요">
                      <Button onClick={() => setAddingComp(true)}>
                        <Plus size={16} strokeWidth={ICON_STROKE} />
                        컴포넌트 추가
                      </Button>
                    </EmptyState>
                  </div>
                </div>
              )
            ) : screen !== 'canvas' ? (
              <div className="mx-auto max-w-(--width-page)">
                <h1 className="mb-header flex h-control items-center type-title">{PLACEHOLDER_SCREENS[screen].title}</h1>
                <div className="rounded-float border-edge border-hairline bg-canvas">
                  <EmptyState title="다음 단계에서 만들 화면이에요" />
                </div>
              </div>
            ) : null}
          </main>
        )}

        {/* 보여 줄 것이 없으면(아무것도 선택하지 않았으면) 패널 자체를 없애 가운데를 넓게 쓴다. */}
        <aside
          // 내용의 너비를 패널 너비로 못박는다. 패널이 길어져 스크롤 막대가 생겨도 칸이 좁아지지 않고, 얇은 막대가 오른쪽 여백 위에 놓인다. 그래서 어느 패널이나 칸의 너비가 같다.
          className="w-panel shrink-0 overflow-x-hidden overflow-y-auto border-l-divider border-hairline [scrollbar-width:thin] *:w-[calc(var(--width-panel)-var(--border-width-divider))] empty:hidden"
          // 입력칸을 눌러 들어가면 적혀 있던 글자를 모두 선택해서 바로 고쳐 쓸 수 있게 한다. 이미 들어가 있는 칸을 다시 누르면 평소처럼 커서가 놓인다.
          onMouseDownCapture={(e) => {
            const input = e.target
            if (!(input instanceof HTMLInputElement) || input.readOnly || document.activeElement === input) return
            if (input.type !== 'text' && input.type !== '') return
            e.preventDefault()
            input.focus()
            input.select()
          }}
          // 칸에 들어올 때의 값을 기억해 둔다. Esc는 그 값으로 되돌리고 칸을 벗어난다(DESIGN.md field-rules).
          // 칸마다 되돌리는 코드를 두지 않고 여기 한 곳에서 한다. 그래야 새로 만드는 칸도 같은 약속을 따른다.
          onFocusCapture={(e) => {
            const input = e.target
            // 패널 안에 그려지는 창(글꼴 고르기)의 칸은 창의 약속을 따른다(Esc는 창을 닫는다).
            if (!(input instanceof HTMLInputElement) || input.closest('[role="dialog"]')) return
            // 오류 문구와 함께 틀린 값이 남아 있는 칸(같은 이름을 적고 벗어난 이름 칸)에 다시 들어온 것이면, 그 틀린 값을 기억하지 않고 처음 들어올 때의 값을 그대로 둔다. Esc가 저장된 값으로 돌아가야 한다.
            const wrong = [input, input.parentElement, input.parentElement?.parentElement].some((el) => el?.nextElementSibling?.matches('.text-danger'))
            if (!wrong || input.dataset.entered === undefined) input.dataset.entered = input.value
          }}
          onKeyDownCapture={(e) => {
            const input = e.target
            if (e.key !== 'Escape' || !(input instanceof HTMLInputElement) || input.readOnly || input.closest('[role="dialog"]')) return
            if ((input.type !== 'text' && input.type !== '') || input.dataset.entered === undefined) return
            e.stopPropagation()
            // 값을 되돌린 것을 그 칸이 "적었다"로 듣게 한다(React는 input 이벤트로 듣는다). 적는 동안은 저장하지 않으므로 저장은 일어나지 않는다.
            if (input.value !== input.dataset.entered) {
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, input.dataset.entered)
              input.dispatchEvent(new Event('input', { bubbles: true }))
            }
            // 되돌린 값이 칸에 반영된 뒤에 벗어난다. 바로 벗어나면 칸이 되돌리기 전의 값을 저장한다.
            setTimeout(() => input.blur())
          }}
        >
          {bare ? null : ready && screen === 'components' && comp ? (
            <ComponentInspector
              key={`${compIndex}-${selectionId}`}
              comp={comp}
              cells={cells}
              tokens={tokens}
              file={compFile}
              otherNames={comps.filter((c) => c !== comp).map((c) => c.name)}
              onChange={changeComp}
              onDeleteVariant={(index) =>
                removePart(() =>
                  changeComp({ ...comp, variants: comp.variants.filter((_, i) => i !== index) }),
                )
              }
              onDeleteSize={(index) =>
                removePart(() =>
                  changeComp({ ...comp, sizes: comp.sizes.filter((_, i) => i !== index) }),
                )
              }
              onDuplicateVariant={duplicateVariant}
              onDuplicateSize={duplicateSize}
              onCopyCss={() => copyText(compCss(comp, tokens),'CSS를 복사했어요.')}
              onDelete={() =>
                removePart(() => {
                  commitComps(comps.filter((c) => c !== comp))
                  setCompIndex(0)
                })
              }
            />
          ) : pickedBoards.length > 0 && selectedTokens.length === 0 && pickedBoards.every((b) => images[b.id]?.text !== undefined) ? (
            <NoteInspector
              picked={pickedBoards}
              size={pickedBoards.every((b) => (images[b.id].size ?? 'md') === (images[pickedBoards[0].id].size ?? 'md')) ? (images[pickedBoards[0].id].size ?? 'md') : null}
              onMove={moveBoards}
              onSize={(size) => sizeNotes(pickedBoards.map((b) => b.id), size)}
            />
          ) : pickedBoards.length > 0 && selectedTokens.length === 0 && pickedBoards.every((b) => b.id in images) ? (
            <ImageInspector picked={pickedBoards} mixed={pickedBoards.some((b) => images[b.id]?.text !== undefined)} onMove={moveBoards} />
          ) : pickedBoards.length > 0 && selectedTokens.length === 0 ? (
            <BoardInspector
              picked={pickedBoards}
              styles={boards}
              titles={Object.fromEntries(TOKEN_SCREEN_IDS.map((id) => [id, TOKEN_SCREENS[id].title]))}
              onMove={moveBoards}
            />
          ) : selectedTokens.length === 1 && wholeGroup ? (
            // 색이 하나뿐인 목록을 목록 이름으로 선택했다. 색이 여럿인 목록을 통째로 선택했을 때와 같은 패널이다.
            <MultiInspector key={selectionId} tokens={selectedTokens} group={wholeGroup} onRenameGroup={(next) => renameGroup(wholeGroup, next)} />
          ) : selectedTokens.length === 1 && commonKind?.id === 'role' ? (
            <RoleInspector
              key={selectionId}
              token={selectedTokens[0]}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind?.id === 'style' ? (
            <TypeInspector
              key={selectionId}
              token={selectedTokens[0]}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onTrack={(value) => commit(withTypeTrack(tokens, selectedTokens[0].name, value))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind?.id === 'spaceuse' ? (
            <SpaceUseInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : // 토대의 길이(크기, 간격, 모서리)는 같은 패널을 쓴다. 모서리도 px이 아닌 값은 일반 패널로 넘긴다. 예전 파일의 간격 가운데 px이 아닌 값(0.5rem)은 숫자 칸으로 고칠 수 없어서 일반 패널로 넘긴다.
          selectedTokens.length === 1 && commonKind && (commonKind.id === 'length' || ((commonKind.id === 'space' || commonKind.id === 'corner' || commonKind.id === 'thickness') && /^\d+px$/.test(selectedTokens[0].value.trim()))) ? (
            <LengthInspector
              key={selectionId}
              kind={commonKind}
              token={selectedTokens[0]}
              tokens={tokens}
              file={file}
              users={tokens.filter((t) => (LENGTH_REF.exec(t.value) ?? SPACE_REF.exec(t.value) ?? CORNER_REF.exec(t.value) ?? THICKNESS_REF.exec(t.value))?.[1] === selectedTokens[0].name).map((t) => t.name)}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onChange={(name, value) => changeLength(selectedTokens[0].name, name, value)}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind && isSizeKind(commonKind) ? (
            <SizeInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind && isEffectKind(commonKind.id) ? (
            <EffectInspector
              key={selectionId}
              token={selectedTokens[0]}
              tokens={tokens}
              kind={commonKind}
              allNames={tokens.map((t) => t.name)}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind && specOf(commonKind) ? (
            <ValueInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              spec={specOf(commonKind)!}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind?.id === 'z' ? (
            <LayerInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind && isBorderKind(commonKind) ? (
            <BorderInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind?.id === 'radius' ? (
            <RadiusInspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              tokens={tokens}
              file={file}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              onOpenToken={goToken}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onChange={(patch) => commit(tokens.map((t) => (t.name === selectedTokens[0].name ? { ...t, ...patch } : t)))}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
            />
          ) : selectedTokens.length === 1 && commonKind ? (
            <Inspector
              key={selectionId}
              token={selectedTokens[0]}
              kind={commonKind}
              file={file}
              allNames={tokens.map((t) => t.name)}
              onRename={(to) => renameToken(selectedTokens[0].name, to)}
              onValue={(value) => {
                const name = selectedTokens[0].name
                const before = tokens.find((t) => t.name === name)
                const next = tokens.map((t) => (t.name === name ? { ...t, value } : t))
                // 글자 크기를 바꾸면 묶인 줄 높이도 새 크기에 맞춘다. 손으로 정해 둔 줄 높이(규칙의 값과 다른 것)는 그대로 둔다.
                const line = SIZE.matches(name) ? lineOf(tokens, name) : undefined
                const follow = before && line ? followLine(before.value, line, value) : null
                const lined = follow ? withLine(next, name, follow) : next
                // 묶인 글자 사이도 규칙대로의 값일 때만 새 크기를 따라간다.
                const track = SIZE.matches(name) ? trackOf(tokens, name) : undefined
                const tracked = before && track ? followTrack(before.value, track, value) : undefined
                commit(tracked === undefined ? lined : withTrack(lined, name, tracked))
              }}
              uses={usesOf(comps, selectedTokens[0].name)}
              onOpenComponent={openComp}
              roles={[
                ...tokens.filter((t) => refOf(t.value) === selectedTokens[0].name).map((t) => t.name),
                ...typeUsers(tokens, selectedTokens[0].name),
                ...tokens.filter((t) => KINDS.shadow.matches(t.name) && shadowRefs(t.value).includes(selectedTokens[0].name)).map((t) => t.name),
                ...tokens.filter((t) => KINDS.gradient.matches(t.name) && colorRefsIn(t.value).includes(selectedTokens[0].name)).map((t) => t.name),
                ...tokens.filter((t) => KINDS.spaceUse.matches(t.name) && SPACE_REF.exec(t.value)?.[1] === selectedTokens[0].name).map((t) => t.name),
              ]}
              onOpenToken={goToken}
              onCopy={(text) => copyText(text, '코드를 복사했어요.')}
              onPickColor={pickColor}
              line={SIZE.matches(selectedTokens[0].name) ? (lineOf(tokens, selectedTokens[0].name) ?? null) : undefined}
              onLine={(value) => commit(withLine(tokens, selectedTokens[0].name, value))}
              track={SIZE.matches(selectedTokens[0].name) ? (trackOf(tokens, selectedTokens[0].name) ?? null) : undefined}
              onTrack={(value) => commit(withTrack(tokens, selectedTokens[0].name, value))}
              scaleMissing={scaleOf(selectedTokens[0].name)?.missing.length ?? null}
              onMakeScale={() => fillScale(selectedTokens[0].name)}
              nameProblem={commonKind.id === 'color' ? (group, name) => colorNameProblem(shortName(COLOR, selectedTokens[0].name), group, name) : undefined}
            />
          ) : selectedTokens.length > 1 ? (
            <MultiInspector
              key={selectionId}
              tokens={selectedTokens}
              group={wholeGroup}
              onRenameGroup={(next) => (wholeGroup ? renameGroup(wholeGroup, next) : null)}
              onRename={stepColorsPicked ? () => setBatch(true) : undefined}
            />
          ) : null}
        </aside>
      </div>

      {creating && (
        <Modal title="디자인 시스템 만들기" onClose={() => setCreating(false)}>
          <NewSystemForm
            onCancel={() => setCreating(false)}
            onCreated={(name) => {
              setCreating(false)
              setSystems((list) => [...(list ?? []), name].sort())
              openSystem(name)
            }}
          />
        </Modal>
      )}

      {pasting && (
        <PasteDialog
          job={pasting}
          onCancel={() => setPasting(null)}
          onPaste={({ overwrite, adopt }) => paste([...pasting.pasted, ...(adopt ? pasting.adoptable : [])], pasting.into, overwrite)}
        />
      )}

      {addingSolo && (
        <Modal title="예외 색 추가" onClose={() => setAddingSolo(false)}>
          <NewSoloForm
            // 예외 색의 이름은 다른 예외 색과도, 목록 이름과도 겹치면 안 된다.
            existing={groupTaken}
            why={takenWhy}
            onCancel={() => setAddingSolo(false)}
            onCreate={addSolo}
          />
        </Modal>
      )}

      {addingType && (
        <Modal title="의미 글꼴 추가" onClose={() => setAddingType(false)}>
          <NewTypeForm
            tokens={tokens}
            onCancel={() => setAddingType(false)}
            onCreate={(name, value, note) => {
              setAddingType(false)
              insertInGroup(
                { name, value, note },
                readTypeNote(note, name.slice(STYLE.prefix.length)).use,
                (t) => (STYLE.matches(t.name) ? readTypeNote(t.note, shortName(STYLE, t.name)).use : null),
                TYPE_USES.map((u) => u.id),
                (t) => t.name.startsWith(STYLE.prefix),
              )
            }}
          />
        </Modal>
      )}

      {addingSpaceUse && (
        <Modal title="의미 간격 추가" onClose={() => setAddingSpaceUse(false)}>
          <NewSpaceUseForm
            tokens={tokens}
            onCancel={() => setAddingSpaceUse(false)}
            onCreate={(name, value, note) => {
              setAddingSpaceUse(false)
              insertInGroup(
                { name, value, note },
                readSpaceNote(note, shortName(KINDS.spaceUse, name)).use,
                (t) => (KINDS.spaceUse.matches(t.name) ? readSpaceNote(t.note, shortName(KINDS.spaceUse, t.name)).use : null),
                SPACE_USES.map((u) => u.id),
                (t) => KINDS.spaceUse.matches(t.name) || KINDS.space.matches(t.name),
              )
            }}
          />
        </Modal>
      )}

      {addingLength && (
        <Modal title={addingLength.addLabel} onClose={() => setAddingLength(null)}>
          <NewLengthForm
            kind={addingLength}
            tokens={tokens}
            onCancel={() => setAddingLength(null)}
            onCreate={(name, value) => {
              const kind = addingLength
              setAddingLength(null)
              // 같은 종류의 뒤에 놓는다(차례는 길이순으로 저절로 맞춰진다).
              if (tokens.some((t) => kind.matches(t.name))) return insert({ name, value }, (t) => kind.matches(t.name))
              // 첫 크기면 간격들(토대와 의미)의 뒤에 놓는다.
              if (kind.id === 'length') return insert({ name, value }, (t) => KINDS.space.matches(t.name) || KINDS.spaceUse.matches(t.name))
              // 첫 테두리면 의미 테두리들의 앞에 놓는다(토대가 의미보다 먼저 적혀 있게). 의미 테두리도 없으면 모서리들(토대와 의미)의 뒤에 놓는다.
              if (kind.id === 'thickness') {
                const firstUse = tokens.findIndex((t) => KINDS.border.matches(t.name) || KINDS.outline.matches(t.name))
                if (firstUse === -1) return insert({ name, value }, (t) => KINDS.corner.matches(t.name) || KINDS.radius.matches(t.name))
                commit([...tokens.slice(0, firstUse), { name, value }, ...tokens.slice(firstUse)])
                return select([name])
              }
              // 첫 모서리면 의미 모서리들의 앞에 놓는다(토대가 의미보다 먼저 적혀 있게). 의미 모서리도 없으면 크기들(토대와 의미)의 뒤에 놓는다.
              if (kind.id === 'corner') {
                const firstUse = tokens.findIndex((t) => KINDS.radius.matches(t.name))
                if (firstUse === -1) return insert({ name, value }, (t) => [KINDS.length, KINDS.height, KINDS.width, KINDS.square].some((k) => k.matches(t.name)))
                commit([...tokens.slice(0, firstUse), { name, value }, ...tokens.slice(firstUse)])
                return select([name])
              }
              // 첫 간격이면 의미 간격들의 앞에 놓는다(토대가 의미보다 먼저 적혀 있게).
              const first = tokens.findIndex((t) => KINDS.spaceUse.matches(t.name))
              const at = first === -1 ? tokens.length : first
              commit([...tokens.slice(0, at), { name, value }, ...tokens.slice(at)])
              select([name])
            }}
          />
        </Modal>
      )}

      {addingSize && (
        <Modal title="의미 크기 추가" onClose={() => setAddingSize(false)}>
          <NewSizeForm
            // 의미 크기 하나를 골라 둔 채 열면 그 종류가 골라져 있다.
            start={commonKind ?? undefined}
            tokens={tokens}
            onCancel={() => setAddingSize(false)}
            onCreate={(kind, name, value, note) => {
              setAddingSize(false)
              // 같은 분류의 마지막 값 뒤에 놓는다(높이·너비·정사각형을 가리지 않는다. 분류의 값들이 파일에서 한데 모여 있게).
              // 그 분류의 첫 값이면 정해진 분류 순서의 제자리에, 의미 크기가 하나도 없으면 크기의 뒤에 놓는다.
              const group = readSizeNote(note, shortName(kind, name)).group
              const inGroup = (t: Token) => sizeGroupOfToken(t) === group
              const after = tokens.some(inGroup) ? inGroup : tokens.some((t) => sizeKindOf(t)) ? (t: Token) => !!sizeKindOf(t) : (t: Token) => KINDS.length.matches(t.name)
              insertInGroup({ name, value, note }, group, sizeGroupOfToken, SIZE_GROUPS.map((g) => g.id), after)
            }}
          />
        </Modal>
      )}

      {addingValue && specOf(addingValue) && (
        <Modal title={addingValue.addLabel} onClose={() => setAddingValue(null)}>
          <NewValueForm
            kind={addingValue}
            spec={specOf(addingValue)!}
            tokens={tokens}
            onCancel={() => setAddingValue(null)}
            onCreate={(name, value, note) => {
              const kind = addingValue
              setAddingValue(null)
              // 같은 종류의 뒤에 놓는다(크기의 차례가 있는 종류는 저절로 제자리에 놓인다). 그 종류의 첫 값이면 파일의 맨 뒤다.
              insert({ name, value, note }, (t) => kind.matches(t.name))
            }}
          />
        </Modal>
      )}

      {addingLayer && (
        <Modal title="겹치는 순서 추가" onClose={() => setAddingLayer(false)}>
          <NewLayerForm
            tokens={tokens}
            onCancel={() => setAddingLayer(false)}
            onCreate={(name, value, note) => {
              setAddingLayer(false)
              // 같은 종류의 뒤에 놓는다(파일에서는 숫자가 작은 것부터 저절로 놓인다). 첫 값이면 파일의 맨 뒤다.
              insert({ name, value, note }, (t) => KINDS.z.matches(t.name))
            }}
          />
        </Modal>
      )}

      {addingBorder && (
        <Modal title={addingBorder.addLabel} onClose={() => setAddingBorder(null)}>
          <NewBorderForm
            kind={addingBorder}
            tokens={tokens}
            onCancel={() => setAddingBorder(null)}
            onCreate={(kind, name, value, note) => {
              setAddingBorder(null)
              // 같은 종류의 뒤에 놓는다. 그 종류의 첫 값이면 테두리(토대)와 다른 의미 테두리의 뒤에 놓는다.
              const group = borderGroupOf(kind, { name, value, note })!
              const inGroup = (t: Token) => borderGroupOf(kind, t) === group
              const after = tokens.some(inGroup) ? inGroup : tokens.some((t) => kind.matches(t.name)) ? (t: Token) => kind.matches(t.name) : (t: Token) => [KINDS.thickness, KINDS.border, KINDS.outline].some((k) => k.matches(t.name))
              insertInGroup({ name, value, note }, group, (t) => borderGroupOf(kind, t), BORDER_GROUPS.map((g) => g.id), after)
            }}
          />
        </Modal>
      )}

      {addingRadius && (
        <Modal title="의미 모서리 추가" onClose={() => setAddingRadius(false)}>
          <NewRadiusForm
            tokens={tokens}
            onCancel={() => setAddingRadius(false)}
            onCreate={(name, value, note) => {
              setAddingRadius(false)
              // 같은 분류 뒤에 놓는다(분류의 값들이 파일에서 한데 모여 있게). 그 분류의 첫 값이면 의미 모서리의 맨 뒤, 첫 의미 모서리면 모서리(토대)의 뒤에 놓는다.
              const kind = KINDS.radius
              const group = readRadiusNote(note, shortName(kind, name)).group
              const inGroup = (t: Token) => kind.matches(t.name) && readRadiusNote(t.note, shortName(kind, t.name)).group === group
              const after = tokens.some(inGroup) ? inGroup : tokens.some((t) => kind.matches(t.name)) ? (t: Token) => kind.matches(t.name) : (t: Token) => KINDS.corner.matches(t.name)
              insertInGroup({ name, value, note }, group, (t) => (kind.matches(t.name) ? readRadiusNote(t.note, shortName(kind, t.name)).group : null), RADIUS_GROUPS.map((g) => g.id), after)
            }}
          />
        </Modal>
      )}

      {addingEffect && (
        <Modal title={addingEffect.addLabel} onClose={() => setAddingEffect(null)}>
          <NewEffectForm
            kind={addingEffect}
            tokens={tokens}
            existing={new Set(tokens.filter((t) => addingEffect.matches(t.name)).map((t) => shortName(addingEffect, t.name)))}
            onCancel={() => setAddingEffect(null)}
            onCreate={(name, value, note) => {
              const kind = addingEffect
              setAddingEffect(null)
              insert({ name, value, note }, (t) => kind.matches(t.name))
            }}
          />
        </Modal>
      )}

      {addingRole && (
        <Modal title="의미 색 추가" onClose={() => setAddingRole(false)}>
          <NewRoleForm tokens={tokens} onCancel={() => setAddingRole(false)} onCreate={addRole} />
        </Modal>
      )}

      {makingSizes && (
        <Modal title="글자 크기 한 벌 만들기" size="size-set" tall onClose={() => setMakingSizes(false)}>
          <NewSizesForm
            existing={new Set(tokens.filter((t) => SIZE.matches(t.name)).map((t) => shortName(SIZE, t.name)))}
            users={usersOfKind(SIZE)}
            fonts={tokens.filter((t) => FONT.matches(t.name)).map((t) => ({ name: shortName(FONT, t.name), value: t.value }))}
            onCancel={() => setMakingSizes(false)}
            onCreate={makeSizes}
          />
        </Modal>
      )}

      {makingTypes && (
        <Modal title="의미 글꼴 한 벌 만들기" size="font" tall onClose={() => setMakingTypes(false)}>
          <NewTypesForm tokens={tokens} users={usersOfKind(STYLE)} onCancel={() => setMakingTypes(false)} onCreate={makeTypes} />
        </Modal>
      )}

      {makingWeights && (
        <Modal title="굵기 한 벌 만들기" size="weight-set" onClose={() => setMakingWeights(false)}>
          <NewWeightsForm
            existing={new Set(tokens.filter((t) => WEIGHT.matches(t.name)).map((t) => shortName(WEIGHT, t.name)))}
            users={usersOfKind(WEIGHT)}
            fonts={tokens.filter((t) => FONT.matches(t.name)).map((t) => ({ name: shortName(FONT, t.name), value: t.value }))}
            onCancel={() => setMakingWeights(false)}
            onCreate={makeWeights}
          />
        </Modal>
      )}

      {addingFont && (
        <Modal title="글꼴 종류 추가" size="font" tall onClose={() => setAddingFont(false)}>
          <NewFontForm
            existing={new Set(tokens.filter((t) => FONT.matches(t.name)).map((t) => shortName(FONT, t.name)))}
            onCancel={() => setAddingFont(false)}
            onCreate={addFont}
          />
        </Modal>
      )}

      {addingFirst !== null && (
        <Modal title={`${addingFirst} 목록에 색 추가`} onClose={() => setAddingFirst(null)}>
          <NewGroupForm
            existing={groupTaken}
            why={takenWhy}
            group={addingFirst}
            onCancel={() => setAddingFirst(null)}
            onCreate={(group, step, value, scale) => {
              setAddingFirst(null)
              addGroup(group, step, value, scale)
            }}
          />
        </Modal>
      )}

      {addingGroup && (
        <Modal title="색 목록 추가" onClose={() => setAddingGroup(false)}>
          <NewGroupForm existing={groupTaken} why={takenWhy} onCancel={() => setAddingGroup(false)} onCreate={addGroup} />
        </Modal>
      )}

      {addingComp && (
        <Modal title="컴포넌트 추가" onClose={() => setAddingComp(false)}>
          <NewNameForm
            label="컴포넌트 이름"
            placeholder="button"
            existing={new Set(comps.map((c) => c.name))}
            onCancel={() => setAddingComp(false)}
            onCreate={addComp}
          />
        </Modal>
      )}

      {batch && stepColorsPicked && (
        <BatchRename picked={selectedTokens} allNames={tokens.map((t) => t.name)} onApply={renameMany} onClose={() => setBatch(false)} />
      )}
      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
      {help && <Shortcuts onClose={() => setHelp(false)} />}
      {notice && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-[24px] left-1/2 z-toast flex h-control -translate-x-1/2 items-center rounded-control bg-ink px-bar-x type-body whitespace-nowrap text-on-primary shadow-float"
        >
          {notice}
        </div>
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="text-ink-soft">{confirm.body}</p>
          <div className="mt-dialog-actions flex justify-end gap-actions">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              취소
            </Button>
            <Button variant="primary" onClick={confirm.run}>
              삭제
            </Button>
          </div>
        </Modal>
      )}
    </div>
    </SampleContext.Provider>
    </PreviewSpaceContext.Provider>
    </PreviewFontContext.Provider>
    </SwatchContext.Provider>
  )
}

function NewNameForm({
  label,
  placeholder,
  existing,
  onCreate,
  onCancel,
}: {
  label: string
  placeholder: string
  existing: Set<string>
  onCreate: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('이름을 입력해 주세요.')
    if (!SLUG.test(trimmed)) return setError(slugMessage(trimmed))
    if (existing.has(trimmed)) return setError('같은 이름이 이미 있어요.')
    onCreate(trimmed)
  }

  return (
    <form onSubmit={submit}>
      <Field label={label} error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder={placeholder}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
      </Field>
      <div className="mt-dialog-actions flex justify-end gap-actions">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          추가
        </Button>
      </div>
    </form>
  )
}
