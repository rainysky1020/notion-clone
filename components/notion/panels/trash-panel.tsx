"use client"

import { useEffect, useState, useTransition } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import {
  emptyTrashAction,
  getTrashedPagesAction,
  permanentDeletePageAction,
  restorePageAction,
} from "@/app/actions/page.actions"
import type { Page } from "@/lib/types/notion"
import { Button } from "@/components/ui/button"

type TrashPanelProps = {
  onRestored: (page: Page) => void
}

function formatDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function TrashPanel({ onRestored }: TrashPanelProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [pending, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      const data = await getTrashedPagesAction()
      setPages(data)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const restore = (id: string) => {
    startTransition(async () => {
      const result = await restorePageAction(id)
      if ("error" in result) return
      setPages((prev) => prev.filter((p) => p.id !== id))
      onRestored(result)
    })
  }

  const permanentDelete = (id: string) => {
    startTransition(async () => {
      const result = await permanentDeletePageAction(id)
      if ("error" in result) return
      setPages((prev) => prev.filter((p) => p.id !== id))
    })
  }

  const emptyAll = () => {
    startTransition(async () => {
      const result = await emptyTrashAction()
      if ("error" in result) return
      setPages([])
    })
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        <Trash2 className="h-8 w-8 opacity-40" />
        <p>휴지통이 비어 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pages.length}개 항목</p>
        <Button variant="outline" size="sm" disabled={pending} onClick={emptyAll}>
          휴지통 비우기
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {pages.map((page) => (
          <li key={page.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl">{page.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{page.title || "제목 없음"}</p>
              <p className="text-xs text-muted-foreground">삭제됨 · {formatDate(page.trashedAt)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                disabled={pending}
                onClick={() => restore(page.id)}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                복원
              </button>
              <button
                disabled={pending}
                onClick={() => permanentDelete(page.id)}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                영구 삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
