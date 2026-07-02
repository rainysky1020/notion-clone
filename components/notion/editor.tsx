"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ImageIcon, Smile, MessageSquarePlus, GripVertical, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Block, Page } from "@/lib/types/notion"
import { blockPlaceholder } from "@/lib/types/notion"

type EditorProps = {
  page: Page
  onChangeTitle: (title: string) => void
  onChangeIcon: (icon: string) => void
  onChangeBlock: (blockId: string, content: string) => void
  onToggleTodo: (blockId: string) => void
  onAddBlock: () => void
}

const EMOJI_CHOICES = ["📄", "👋", "🗺️", "📌", "📝", "📚", "🚀", "💡", "✅", "🎯", "🔥", "⭐", "🧠", "📊"]

function EditableText({
  content,
  onChange,
  className,
  placeholder,
}: {
  content: string
  onChange: (content: string) => void
  className?: string
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const composing = useRef(false)
  const lastSynced = useRef(content)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    if (el.textContent !== content) {
      el.textContent = content
      lastSynced.current = content
    }
  }, [content])

  const syncChange = () => {
    const el = ref.current
    if (!el) return
    const next = el.textContent ?? ""
    if (next === lastSynced.current) return
    lastSynced.current = next
    onChange(next)
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={() => {
        composing.current = false
        syncChange()
      }}
      onInput={() => {
        if (!composing.current) syncChange()
      }}
      onBlur={syncChange}
      data-placeholder={placeholder}
      className={cn(
        "empty:before:text-muted-foreground/50 empty:before:content-[attr(data-placeholder)]",
        className,
      )}
    />
  )
}

function BlockView({
  block,
  onChange,
  onToggleTodo,
}: {
  block: Block
  onChange: (content: string) => void
  onToggleTodo: () => void
}) {
  const common =
    "w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60"

  if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
    const sizes = {
      h1: "text-3xl font-bold mt-6",
      h2: "text-2xl font-bold mt-5",
      h3: "text-xl font-semibold mt-4",
    }
    return (
      <EditableText
        content={block.content}
        onChange={onChange}
        placeholder={blockPlaceholder[block.type]}
        className={cn(common, sizes[block.type], "leading-snug")}
      />
    )
  }

  if (block.type === "bullet") {
    return (
      <div className="flex items-start gap-2">
        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
        <EditableText
          content={block.content}
          onChange={onChange}
          placeholder={blockPlaceholder.bullet}
          className={cn(common, "leading-7")}
        />
      </div>
    )
  }

  if (block.type === "todo") {
    return (
      <div className="flex items-start gap-2">
        <button
          aria-label="할 일 완료 토글"
          onClick={onToggleTodo}
          className={cn(
            "mt-[5px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
            block.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
          )}
        >
          {block.checked && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <EditableText
          content={block.content}
          onChange={onChange}
          placeholder={blockPlaceholder.todo}
          className={cn(
            common,
            "leading-7",
            block.checked && "text-muted-foreground line-through",
          )}
        />
      </div>
    )
  }

  if (block.type === "quote") {
    return (
      <div className="border-l-[3px] border-foreground pl-3.5">
        <EditableText
          content={block.content}
          onChange={onChange}
          placeholder={blockPlaceholder.quote}
          className={cn(common, "leading-7")}
        />
      </div>
    )
  }

  return (
    <EditableText
      content={block.content}
      onChange={onChange}
      placeholder={blockPlaceholder.text}
      className={cn(common, "leading-7")}
    />
  )
}

export function Editor({
  page,
  onChangeTitle,
  onChangeIcon,
  onChangeBlock,
  onToggleTodo,
  onAddBlock,
}: EditorProps) {
  const [showEmoji, setShowEmoji] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      {/* Cover gradient placeholder */}
      <div className="h-[140px] w-full bg-secondary" />

      <div className="mx-auto w-full max-w-[720px] px-12 pb-32">
        {/* Icon */}
        <div className="relative -mt-12 mb-1">
          <button
            onClick={() => setShowEmoji((s) => !s)}
            className="flex h-[78px] w-[78px] items-center justify-center rounded-lg text-[64px] leading-none hover:bg-accent"
            aria-label="아이콘 변경"
          >
            {page.icon}
          </button>
          {showEmoji && (
            <div className="absolute left-0 top-[82px] z-10 grid w-[300px] grid-cols-7 gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onChangeIcon(e)
                    setShowEmoji(false)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded text-2xl hover:bg-accent"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover actions */}
        <div className="mb-2 flex items-center gap-3 text-sm text-muted-foreground">
          <button className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent">
            <Smile className="h-4 w-4" /> 아이콘
          </button>
          <button className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent">
            <ImageIcon className="h-4 w-4" /> 커버 추가
          </button>
          <button className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent">
            <MessageSquarePlus className="h-4 w-4" /> 댓글
          </button>
        </div>

        {/* Title */}
        <input
          value={page.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="제목 없음"
          className="w-full bg-transparent text-[40px] font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground/40"
        />

        {/* Blocks */}
        <div className="mt-3 space-y-1">
          {page.blocks.map((block) => (
            <div key={block.id} className="group/block relative">
              <div className="absolute -left-9 top-1 hidden items-center gap-0.5 group-hover/block:flex">
                <button
                  onClick={onAddBlock}
                  aria-label="블록 추가"
                  className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  aria-label="블록 이동"
                  className="flex h-6 w-4 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded px-1 py-0.5">
                <BlockView
                  key={block.id}
                  block={block}
                  onChange={(content) => onChangeBlock(block.id, content)}
                  onToggleTodo={() => onToggleTodo(block.id)}
                />
              </div>
            </div>
          ))}

          <button
            onClick={onAddBlock}
            className="mt-1 w-full rounded px-1 py-1 text-left text-muted-foreground/60 hover:bg-accent"
          >
            입력하거나 명령어는 &apos;/&apos; 를 누르세요
          </button>
        </div>
      </div>
    </div>
  )
}
