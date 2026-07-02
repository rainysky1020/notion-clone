"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type WorkspacePanelProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  width?: "sm" | "md" | "lg"
}

const widths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
}

export function WorkspacePanel({
  open,
  title,
  onClose,
  children,
  className,
  width = "md",
}: WorkspacePanelProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="패널 닫기"
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full w-full flex-col border-l border-border bg-background shadow-xl",
          widths[width],
          className,
        )}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

type CenterModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function CenterModal({ open, title, onClose, children }: CenterModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="모달 닫기" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(80vh-2.75rem)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
