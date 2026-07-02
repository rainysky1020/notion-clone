"use client"

import { useEffect, useState, useTransition } from "react"
import { Clock } from "lucide-react"
import { getPageHistoryAction } from "@/app/actions/page.actions"
import type { PageHistoryEntry } from "@/lib/types/notion"

type HistoryPanelProps = {
  pageId?: string
  onSelectPage?: (id: string) => void
}

const actionLabels: Record<string, string> = {
  created: "생성",
  template: "템플릿",
  title_change: "제목 변경",
  icon_change: "아이콘 변경",
  block_edit: "내용 수정",
  todo_toggle: "할 일 변경",
  favorited: "즐겨찾기 추가",
  unfavorited: "즐겨찾기 제거",
  trashed: "휴지통 이동",
  restored: "복원",
  duplicated: "복제",
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "방금 전"
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function HistoryPanel({ pageId, onSelectPage }: HistoryPanelProps) {
  const [entries, setEntries] = useState<PageHistoryEntry[]>([])
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await getPageHistoryAction(pageId)
      setEntries(data)
    })
  }, [pageId])

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <Clock className="h-8 w-8 opacity-40" />
        <p>편집 기록이 없습니다.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none">{entry.pageIcon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {onSelectPage ? (
                  <button
                    onClick={() => onSelectPage(entry.pageId)}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {entry.pageTitle || "제목 없음"}
                  </button>
                ) : (
                  <span className="truncate text-sm font-medium">{entry.pageTitle || "제목 없음"}</span>
                )}
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {actionLabels[entry.action] ?? entry.action}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{entry.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">{formatTime(entry.createdAt)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
