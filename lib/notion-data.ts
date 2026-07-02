export type Block = {
  id: string
  type: "text" | "h1" | "h2" | "h3" | "bullet" | "todo" | "quote"
  content: string
  checked?: boolean
}

export type Page = {
  id: string
  icon: string
  title: string
  parentId: string | null
  blocks: Block[]
}

let counter = 100

export function uid(prefix = "id") {
  counter += 1
  return `${prefix}-${counter}`
}

export const initialPages: Page[] = [
  {
    id: "p-getting-started",
    icon: "👋",
    title: "시작하기",
    parentId: null,
    blocks: [
      { id: "b1", type: "text", content: "이 워크스페이스에 오신 것을 환영합니다. 왼쪽에서 페이지를 만들고, 정리하고, 삭제해 보세요." },
      { id: "b2", type: "h2", content: "기본 사용법" },
      { id: "b3", type: "bullet", content: "사이드바에서 페이지를 클릭해 이동합니다." },
      { id: "b4", type: "bullet", content: "각 항목에 마우스를 올리면 추가/삭제 버튼이 나타납니다." },
      { id: "b5", type: "todo", content: "첫 번째 페이지 만들어 보기", checked: true },
      { id: "b6", type: "todo", content: "할 일 목록 작성하기", checked: false },
      { id: "b7", type: "quote", content: "작은 단위로 생각을 정리하면 큰 그림이 보입니다." },
    ],
  },
  {
    id: "p-roadmap",
    icon: "🗺️",
    title: "제품 로드맵",
    parentId: null,
    blocks: [
      { id: "b1", type: "h2", content: "2026년 1분기" },
      { id: "b2", type: "todo", content: "온보딩 플로우 개선", checked: false },
      { id: "b3", type: "todo", content: "다크 모드 지원", checked: false },
      { id: "b4", type: "text", content: "우선순위가 높은 항목부터 진행합니다." },
    ],
  },
  {
    id: "p-q1-planning",
    icon: "📌",
    title: "분기 기획 회의",
    parentId: "p-roadmap",
    blocks: [
      { id: "b1", type: "text", content: "회의 노트를 여기에 작성하세요." },
      { id: "b2", type: "bullet", content: "참석자: 디자인, 엔지니어링, PM" },
    ],
  },
  {
    id: "p-notes",
    icon: "📝",
    title: "회의록",
    parentId: null,
    blocks: [
      { id: "b1", type: "h2", content: "주간 동기화" },
      { id: "b2", type: "text", content: "이번 주 진행 상황과 막힌 부분을 공유합니다." },
    ],
  },
  {
    id: "p-reading",
    icon: "📚",
    title: "읽을 거리",
    parentId: null,
    blocks: [
      { id: "b1", type: "bullet", content: "디자인 시스템에 관한 글" },
      { id: "b2", type: "bullet", content: "생산성 워크플로우 정리" },
    ],
  },
]

export const blockPlaceholder: Record<Block["type"], string> = {
  text: "내용을 입력하세요...",
  h1: "제목 1",
  h2: "제목 2",
  h3: "제목 3",
  bullet: "목록 항목",
  todo: "할 일",
  quote: "인용구",
}
