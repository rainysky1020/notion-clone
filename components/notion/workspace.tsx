"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
  ChevronRight,
  Menu,
  Star,
  MessageSquare,
  Clock,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { Editor } from "./editor"
import { WorkspacePanel, CenterModal } from "./workspace-panel"
import { FavoritesPanel } from "./panels/favorites-panel"
import { TemplatesPanel } from "./panels/templates-panel"
import { TrashPanel } from "./panels/trash-panel"
import { SettingsPanel } from "./panels/settings-panel"
import { HistoryPanel } from "./panels/history-panel"
import { MoreMenu } from "./more-menu"
import {
  createPageAction,
  deletePageAction,
  duplicatePageAction,
  toggleFavoriteAction,
  updatePageAction,
} from "@/app/actions/page.actions"
import { createBlockAction, updateBlockAction } from "@/app/actions/block.actions"
import { signOutAction } from "@/app/actions/auth.actions"
import type { Block, Page, UserSettings } from "@/lib/types/notion"

export type PanelType = "favorites" | "templates" | "trash" | "settings" | "history" | null

type WorkspaceProps = {
  initialPages: Page[]
  userName?: string | null
  initialSettings?: UserSettings
}

export function Workspace({ initialPages, userName: initialUserName, initialSettings }: WorkspaceProps) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [activeId, setActiveId] = useState<string>(initialPages[0]?.id ?? "")
  const [collapsed, setCollapsed] = useState(false)
  const [panel, setPanel] = useState<PanelType>(null)
  const [mainView, setMainView] = useState<"editor" | "trash">("editor")
  const [userName, setUserName] = useState(initialUserName)
  const [, startTransition] = useTransition()
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blockTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!initialSettings) return
    const root = document.documentElement
    root.classList.remove("light", "dark")
    if (initialSettings.theme === "light") root.classList.add("light")
    else if (initialSettings.theme === "dark") root.classList.add("dark")
  }, [initialSettings])

  const activePage = pages.find((p) => p.id === activeId) ?? pages[0]

  const breadcrumb = useMemo(() => {
    if (!activePage) return []
    const trail: Page[] = []
    let current: Page | undefined = activePage
    while (current) {
      trail.unshift(current)
      const parentId: string | null = current.parentId
      current = parentId ? pages.find((p) => p.id === parentId) : undefined
    }
    return trail
  }, [activePage, pages])

  const openPanel = (p: PanelType) => {
    setPanel(p)
    if (p === "trash") setMainView("trash")
    else setMainView("editor")
  }

  const closePanel = () => {
    setPanel(null)
    if (mainView === "trash") setMainView("editor")
  }

  const createPage = (parentId: string | null) => {
    startTransition(async () => {
      const result = await createPageAction(parentId)
      if ("error" in result) return
      setPages((prev) => [...prev, result])
      setActiveId(result.id)
      setMainView("editor")
    })
  }

  const addPage = (page: Page) => {
    setPages((prev) => [...prev, page])
    setActiveId(page.id)
    setMainView("editor")
  }

  const deletePage = (id: string) => {
    startTransition(async () => {
      const result = await deletePageAction(id)
      if ("error" in result) return

      setPages((prev) => {
        const idsToRemove = new Set<string>()
        const collect = (pid: string) => {
          idsToRemove.add(pid)
          prev.filter((p) => p.parentId === pid).forEach((c) => collect(c.id))
        }
        collect(id)
        const remaining = prev.filter((p) => !idsToRemove.has(p.id))
        if (idsToRemove.has(activeId) && remaining.length > 0) {
          setActiveId(remaining[0].id)
        } else if (remaining.length === 0) {
          setActiveId("")
        }
        return remaining
      })
    })
  }

  const updateActive = useCallback((updater: (page: Page) => Page) => {
    setPages((prev) => prev.map((p) => (p.id === activeId ? updater(p) : p)))
  }, [activeId])

  const changeTitle = (title: string) => {
    updateActive((p) => ({ ...p, title }))
    if (titleTimer.current) clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => {
      startTransition(() => {
        void updatePageAction(activeId, { title })
      })
    }, 400)
  }

  const changeIcon = (icon: string) => {
    updateActive((p) => ({ ...p, icon }))
    startTransition(() => {
      void updatePageAction(activeId, { icon })
    })
  }

  const changeBlock = (blockId: string, content: string) => {
    updateActive((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
    }))

    const existing = blockTimers.current.get(blockId)
    if (existing) clearTimeout(existing)
    blockTimers.current.set(
      blockId,
      setTimeout(() => {
        startTransition(() => {
          void updateBlockAction(blockId, { content })
        })
        blockTimers.current.delete(blockId)
      }, 400),
    )
  }

  const toggleTodo = (blockId: string) => {
    let nextChecked = false
    updateActive((p) => ({
      ...p,
      blocks: p.blocks.map((b) => {
        if (b.id === blockId) {
          nextChecked = !b.checked
          return { ...b, checked: nextChecked }
        }
        return b
      }),
    }))
    startTransition(() => {
      void updateBlockAction(blockId, { checked: nextChecked })
    })
  }

  const addBlock = () => {
    if (!activePage) return
    startTransition(async () => {
      const result = await createBlockAction(activePage.id)
      if ("error" in result) return
      const newBlock: Block = { id: result.id, type: "text", content: "" }
      updateActive((p) => ({ ...p, blocks: [...p.blocks, newBlock] }))
    })
  }

  const toggleFavorite = () => {
    if (!activePage) return
    startTransition(async () => {
      const result = await toggleFavoriteAction(activePage.id)
      if ("error" in result) return
      setPages((prev) => prev.map((p) => (p.id === result.id ? result : p)))
    })
  }

  const duplicatePage = () => {
    if (!activePage) return
    startTransition(async () => {
      const result = await duplicatePageAction(activePage.id)
      if ("error" in result) return
      setPages((prev) => [...prev, result])
      setActiveId(result.id)
    })
  }

  const lastEdited = activePage
    ? formatRelativeTime(activePage.updatedAt)
    : ""

  if (!activePage && mainView === "editor") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">아직 페이지가 없습니다.</p>
        <button
          onClick={() => createPage(null)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          첫 페이지 만들기
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {!collapsed && (
        <Sidebar
          pages={pages}
          activeId={activeId}
          activePanel={panel}
          onSelect={(id) => {
            setActiveId(id)
            setMainView("editor")
            setPanel(null)
          }}
          onCreate={createPage}
          onDelete={deletePage}
          onCollapse={() => setCollapsed(true)}
          onOpenPanel={openPanel}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex min-w-0 items-center gap-1">
            {collapsed && (
              <button
                aria-label="사이드바 열기"
                onClick={() => setCollapsed(false)}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            {mainView === "editor" && activePage && (
              <nav className="flex min-w-0 items-center text-sm text-foreground/80">
                {breadcrumb.map((p, i) => (
                  <span key={p.id} className="flex min-w-0 items-center">
                    {i > 0 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <button
                      onClick={() => setActiveId(p.id)}
                      className="flex min-w-0 items-center gap-1 rounded px-1.5 py-1 hover:bg-accent"
                    >
                      <span className="text-sm leading-none">{p.icon}</span>
                      <span className="truncate">{p.title || "제목 없음"}</span>
                    </button>
                  </span>
                ))}
              </nav>
            )}
            {mainView === "trash" && (
              <span className="text-sm font-medium">휴지통</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {userName && <span className="hidden px-2 sm:block">{userName}</span>}
            {mainView === "editor" && activePage && (
              <span className="hidden px-2 sm:block">편집함 {lastEdited}</span>
            )}
            {mainView === "editor" && activePage && (
              <>
                <button className="rounded px-2 py-1 hover:bg-accent">공유</button>
                <button aria-label="댓글" className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent">
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  aria-label="편집 기록"
                  onClick={() => openPanel("history")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded hover:bg-accent",
                    panel === "history" && "bg-accent text-foreground",
                  )}
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  aria-label="즐겨찾기"
                  onClick={toggleFavorite}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded hover:bg-accent",
                    activePage.isFavorite && "text-primary",
                  )}
                >
                  <Star className={cn("h-4 w-4", activePage.isFavorite && "fill-current")} />
                </button>
                <MoreMenu
                  isFavorite={activePage.isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onDuplicate={duplicatePage}
                  onTrash={() => deletePage(activePage.id)}
                  onOpenSettings={() => openPanel("settings")}
                  onOpenHistory={() => openPanel("history")}
                  pageTitle={activePage.title}
                  updatedAt={activePage.updatedAt}
                />
              </>
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="로그아웃"
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="min-h-0 flex-1">
          {mainView === "trash" ? (
            <div className="h-full overflow-y-auto p-6">
              <TrashPanel
                onRestored={(page) => {
                  setPages((prev) => [...prev, page])
                  setActiveId(page.id)
                  setMainView("editor")
                  setPanel(null)
                }}
              />
            </div>
          ) : activePage ? (
            <Editor
              key={activePage.id}
              page={activePage}
              onChangeTitle={changeTitle}
              onChangeIcon={changeIcon}
              onChangeBlock={changeBlock}
              onToggleTodo={toggleTodo}
              onAddBlock={addBlock}
            />
          ) : null}
        </main>
      </div>

      <WorkspacePanel
        open={panel === "favorites"}
        title="즐겨찾기"
        onClose={closePanel}
      >
        <FavoritesPanel
          onSelect={setActiveId}
          onClose={closePanel}
        />
      </WorkspacePanel>

      <CenterModal
        open={panel === "templates"}
        title="템플릿"
        onClose={closePanel}
      >
        <TemplatesPanel onCreated={addPage} onClose={closePanel} />
      </CenterModal>

      <WorkspacePanel
        open={panel === "settings"}
        title="설정"
        onClose={closePanel}
      >
        <SettingsPanel
          onSaved={(s) => {
            setUserName(s.name)
          }}
        />
      </WorkspacePanel>

      <WorkspacePanel
        open={panel === "history"}
        title={activePage ? `"${activePage.title}" 편집 기록` : "편집 기록"}
        onClose={closePanel}
        width="lg"
      >
        <HistoryPanel
          pageId={activePage?.id}
          onSelectPage={(id) => {
            setActiveId(id)
            closePanel()
          }}
        />
      </WorkspacePanel>
    </div>
  )
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "방금 전"
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}
