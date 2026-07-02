"use client"

import { useEffect, useState, useTransition } from "react"
import { createPageFromTemplateAction, getTemplatesAction } from "@/app/actions/page.actions"
import type { Page } from "@/lib/types/notion"
import type { PageTemplate } from "@/lib/templates"

type TemplatesPanelProps = {
  onCreated: (page: Page) => void
  onClose: () => void
}

export function TemplatesPanel({ onCreated, onClose }: TemplatesPanelProps) {
  const [templates, setTemplates] = useState<PageTemplate[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await getTemplatesAction()
      setTemplates(data)
    })
  }, [])

  const useTemplate = (templateId: string) => {
    startTransition(async () => {
      const result = await createPageFromTemplateAction(templateId)
      if ("error" in result) return
      onCreated(result)
      onClose()
    })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <button
          key={t.id}
          disabled={pending}
          onClick={() => useTemplate(t.id)}
          className="flex flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-50"
        >
          <span className="text-3xl">{t.icon}</span>
          <div>
            <p className="font-medium">{t.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
