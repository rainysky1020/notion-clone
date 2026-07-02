"use client"

import { useEffect, useState, useTransition } from "react"
import { Star } from "lucide-react"
import { getFavoritePagesAction } from "@/app/actions/page.actions"
import type { Page } from "@/lib/types/notion"

type FavoritesPanelProps = {
  onSelect: (id: string) => void
  onClose: () => void
}

export function FavoritesPanel({ onSelect, onClose }: FavoritesPanelProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await getFavoritePagesAction()
      setPages(data)
    })
  }, [])

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <Star className="h-8 w-8 opacity-40" />
        <p>즐겨찾기한 페이지가 없습니다.</p>
        <p className="text-xs">페이지 상단의 별 아이콘을 눌러 추가하세요.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {pages.map((page) => (
        <li key={page.id}>
          <button
            onClick={() => {
              onSelect(page.id)
              onClose()
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
          >
            <span className="text-base leading-none">{page.icon}</span>
            <span className="truncate">{page.title || "제목 없음"}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
