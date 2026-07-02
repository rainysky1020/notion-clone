"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, Star, Trash2, Settings, Clock, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

type MoreMenuProps = {
  isFavorite: boolean
  onToggleFavorite: () => void
  onDuplicate: () => void
  onTrash: () => void
  onOpenSettings: () => void
  onOpenHistory: () => void
  pageTitle: string
  updatedAt: string
}

export function MoreMenu({
  isFavorite,
  onToggleFavorite,
  onDuplicate,
  onTrash,
  onOpenSettings,
  onOpenHistory,
  pageTitle,
  updatedAt,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const items = [
    {
      icon: Star,
      label: isFavorite ? "즐겨찾기 제거" : "즐겨찾기 추가",
      onClick: () => { onToggleFavorite(); setOpen(false) },
      active: isFavorite,
    },
    {
      icon: Copy,
      label: "페이지 복제",
      onClick: () => { onDuplicate(); setOpen(false) },
    },
    {
      icon: Clock,
      label: "편집 기록",
      onClick: () => { onOpenHistory(); setOpen(false) },
    },
    {
      icon: Settings,
      label: "설정",
      onClick: () => { onOpenSettings(); setOpen(false) },
    },
    {
      icon: Trash2,
      label: "휴지통으로 이동",
      onClick: () => { onTrash(); setOpen(false) },
      destructive: true,
    },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="더보기"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded hover:bg-accent",
          open && "bg-accent",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-popover py-1 shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs font-medium">{pageTitle || "제목 없음"}</p>
            <p className="text-[10px] text-muted-foreground">
              마지막 수정 {new Date(updatedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
          {items.map(({ icon: Icon, label, onClick, active, destructive }) => (
            <button
              key={label}
              onClick={onClick}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent",
                destructive && "text-destructive hover:bg-destructive/10",
                active && !destructive && "text-primary",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "fill-current")} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
