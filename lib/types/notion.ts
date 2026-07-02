export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "todo"
  | "quote"

export type Block = {
  id: string
  type: BlockType
  content: string
  checked?: boolean
}

export type Page = {
  id: string
  icon: string
  title: string
  parentId: string | null
  isFavorite: boolean
  isTrashed: boolean
  trashedAt: string | null
  blocks: Block[]
  updatedAt: string
}

export type PageHistoryEntry = {
  id: string
  pageId: string
  pageTitle: string
  pageIcon: string
  action: string
  summary: string
  createdAt: string
}

export type UserSettings = {
  name: string | null
  email: string
  theme: "light" | "dark" | "system"
}

export const blockPlaceholder: Record<BlockType, string> = {
  text: "내용을 입력하세요...",
  h1: "제목 1",
  h2: "제목 2",
  h3: "제목 3",
  bullet: "목록 항목",
  todo: "할 일",
  quote: "인용구",
}
