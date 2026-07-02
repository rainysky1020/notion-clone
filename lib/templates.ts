import type { BlockType } from "@/lib/types/notion"

export type PageTemplate = {
  id: string
  name: string
  description: string
  icon: string
  title: string
  blocks: { type: BlockType; content: string; checked?: boolean }[]
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "meeting",
    name: "회의록",
    description: "회의 안건과 결정 사항을 기록합니다",
    icon: "📝",
    title: "회의록",
    blocks: [
      { type: "h2", content: "회의 정보" },
      { type: "bullet", content: "일시:" },
      { type: "bullet", content: "참석자:" },
      { type: "h2", content: "안건" },
      { type: "todo", content: "안건 1", checked: false },
      { type: "h2", content: "결정 사항" },
      { type: "text", content: "회의 내용을 여기에 작성하세요." },
    ],
  },
  {
    id: "roadmap",
    name: "제품 로드맵",
    description: "분기별 목표와 마일스톤을 정리합니다",
    icon: "🗺️",
    title: "제품 로드맵",
    blocks: [
      { type: "h2", content: "이번 분기 목표" },
      { type: "todo", content: "핵심 기능 출시", checked: false },
      { type: "todo", content: "사용자 피드백 반영", checked: false },
      { type: "quote", content: "작은 단위로 생각을 정리하면 큰 그림이 보입니다." },
    ],
  },
  {
    id: "weekly",
    name: "주간 계획",
    description: "이번 주 할 일과 우선순위를 관리합니다",
    icon: "📅",
    title: "주간 계획",
    blocks: [
      { type: "h2", content: "이번 주 목표" },
      { type: "todo", content: "우선순위 1", checked: false },
      { type: "todo", content: "우선순위 2", checked: false },
      { type: "h2", content: "메모" },
      { type: "text", content: "이번 주 진행 상황을 기록하세요." },
    ],
  },
  {
    id: "reading",
    name: "읽을 거리",
    description: "읽고 싶은 글과 자료를 모아둡니다",
    icon: "📚",
    title: "읽을 거리",
    blocks: [
      { type: "bullet", content: "추천 글 1" },
      { type: "bullet", content: "추천 글 2" },
      { type: "bullet", content: "추천 글 3" },
    ],
  },
]
