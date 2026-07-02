"use client"

import { useState } from "react"
import {
  Search,
  Home,
  Inbox,
  Settings,
  Plus,
  ChevronRight,
  ChevronsLeft,
  Trash2,
  Star,
  FileText,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Page } from "@/lib/types/notion"
import type { PanelType } from "./workspace"

type SidebarProps = {
  pages: Page[]
  activeId: string
  activePanel: PanelType
  onSelect: (id: string) => void
  onCreate: (parentId: string | null) => void
  onDelete: (id: string) => void
  onCollapse: () => void
  onOpenPanel: (panel: PanelType) => void
}

function PageTree({
  pages,
  parentId,
  depth,
  activeId,
  expanded,
  toggleExpand,
  onSelect,
  onCreate,
  onDelete,
}: {
  pages: Page[]
  parentId: string | null
  depth: number
  activeId: string
  expanded: Record<string, boolean>
  toggleExpand: (id: string) => void
  onSelect: (id: string) => void
  onCreate: (parentId: string | null) => void
  onDelete: (id: string) => void
}) {
  const items = pages.filter((p) => p.parentId === parentId)

  return (
    <>
      {items.map((page) => {
        const children = pages.filter((p) => p.parentId === page.id)
        const hasChildren = children.length > 0
        const isOpen = expanded[page.id]
        const isActive = activeId === page.id

        return (
          <div key={page.id}>
            <div
              className={cn(
                "group/item flex items-center gap-1 rounded-md py-1 pr-1 text-sm cursor-pointer select-none",
                "hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent font-medium",
              )}
              style={{ paddingLeft: `${depth * 14 + 6}px` }}
              onClick={() => onSelect(page.id)}
            >
              <button
                aria-label="하위 페이지 펼치기"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(page.id)
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-black/10"
              >
                <span className="hidden group-hover/item:block">
                  <ChevronRight
                    className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")}
                  />
                </span>
                <span className="block text-base leading-none group-hover/item:hidden">{page.icon}</span>
              </button>
              <span className="flex-1 truncate text-sidebar-foreground/90">{page.title}</span>
              {page.isFavorite && (
                <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
              )}
              <button
                aria-label="페이지 삭제"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(page.id)
                }}
                className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-black/10 group-hover/item:flex"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="하위 페이지 추가"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreate(page.id)
                  if (!isOpen) toggleExpand(page.id)
                }}
                className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-black/10 group-hover/item:flex"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {hasChildren && isOpen && (
              <PageTree
                pages={pages}
                parentId={page.id}
                depth={depth + 1}
                activeId={activeId}
                expanded={expanded}
                toggleExpand={toggleExpand}
                onSelect={onSelect}
                onCreate={onCreate}
                onDelete={onDelete}
              />
            )}

            {!hasChildren && isOpen && (
              <div
                className="py-1 text-sm text-muted-foreground"
                style={{ paddingLeft: `${(depth + 1) * 14 + 26}px` }}
              >
                하위 페이지 없음
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-sidebar-accent",
        active ? "bg-sidebar-accent font-medium text-sidebar-foreground" : "text-sidebar-foreground/80",
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

export function Sidebar({
  pages,
  activeId,
  activePanel,
  onSelect,
  onCreate,
  onDelete,
  onCollapse,
  onOpenPanel,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const favoritePages = pages.filter((p) => p.isFavorite)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="group flex items-center gap-2 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-[11px] font-semibold text-background">
          W
        </div>
        <span className="flex-1 truncate text-sm font-medium text-sidebar-foreground">
          내 워크스페이스
        </span>
        <button
          aria-label="사이드바 접기"
          onClick={onCollapse}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-sidebar-accent group-hover:opacity-100"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-2 pb-2">
        <NavItem icon={<Search className="h-4 w-4" />} label="검색" />
        <NavItem icon={<Sparkles className="h-4 w-4" />} label="Notion AI" />
        <NavItem
          icon={<Home className="h-4 w-4" />}
          label="홈"
          onClick={() => onOpenPanel(null)}
        />
        <NavItem icon={<Inbox className="h-4 w-4" />} label="수신함" />
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {favoritePages.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between px-1.5 pb-1">
              <span className="text-xs font-medium text-muted-foreground">즐겨찾기</span>
              <button
                onClick={() => onOpenPanel("favorites")}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                모두 보기
              </button>
            </div>
            {favoritePages.slice(0, 5).map((page) => (
              <button
                key={page.id}
                onClick={() => onSelect(page.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-sidebar-accent",
                  activeId === page.id && "bg-sidebar-accent font-medium",
                )}
              >
                <span className="text-base leading-none">{page.icon}</span>
                <span className="truncate">{page.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-1.5 pb-1 pt-1">
          <span className="text-xs font-medium text-muted-foreground">개인 페이지</span>
          <button
            aria-label="새 페이지 추가"
            onClick={() => onCreate(null)}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <PageTree
          pages={pages}
          parentId={null}
          depth={0}
          activeId={activeId}
          expanded={expanded}
          toggleExpand={toggleExpand}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={onDelete}
        />

        <button
          onClick={() => onCreate(null)}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-4 w-4" />
          <span>페이지 추가</span>
        </button>
      </div>

      <div className="border-t border-sidebar-border px-2 py-2">
        <NavItem
          icon={<Star className="h-4 w-4" />}
          label="즐겨찾기"
          active={activePanel === "favorites"}
          onClick={() => onOpenPanel("favorites")}
        />
        <NavItem
          icon={<FileText className="h-4 w-4" />}
          label="템플릿"
          active={activePanel === "templates"}
          onClick={() => onOpenPanel("templates")}
        />
        <NavItem
          icon={<Trash2 className="h-4 w-4" />}
          label="휴지통"
          active={activePanel === "trash"}
          onClick={() => onOpenPanel("trash")}
        />
        <NavItem
          icon={<Settings className="h-4 w-4" />}
          label="설정"
          active={activePanel === "settings"}
          onClick={() => onOpenPanel("settings")}
        />
      </div>
    </aside>
  )
}
