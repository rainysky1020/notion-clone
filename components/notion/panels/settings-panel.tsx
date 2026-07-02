"use client"

import { useEffect, useState, useTransition } from "react"
import { getSettingsAction, updateSettingsAction } from "@/app/actions/page.actions"
import type { UserSettings } from "@/lib/types/notion"
import { Button } from "@/components/ui/button"

type SettingsPanelProps = {
  onSaved: (settings: UserSettings) => void
}

export function SettingsPanel({ onSaved }: SettingsPanelProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [name, setName] = useState("")
  const [theme, setTheme] = useState<UserSettings["theme"]>("system")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await getSettingsAction()
      setSettings(data)
      setName(data.name ?? "")
      setTheme(data.theme)
      applyTheme(data.theme)
    })
  }, [])

  const applyTheme = (t: UserSettings["theme"]) => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    if (t === "light") root.classList.add("light")
    else if (t === "dark") root.classList.add("dark")
  }

  const save = () => {
    startTransition(async () => {
      const result = await updateSettingsAction({ name: name.trim() || undefined, theme })
      if ("error" in result) {
        setMessage(result.error)
        return
      }
      setSettings(result)
      applyTheme(result.theme)
      onSaved(result)
      setMessage("설정이 저장되었습니다.")
      setTimeout(() => setMessage(null), 2000)
    })
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="settings-name" className="text-sm font-medium">
            이름
          </label>
          <input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">이메일</label>
          <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {settings.email}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">테마</label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {t === "light" ? "라이트" : t === "dark" ? "다크" : "시스템"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("오류") || message.includes("없") ? "text-destructive" : "text-primary"}`}>
          {message}
        </p>
      )}

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "저장 중..." : "설정 저장"}
      </Button>
    </div>
  )
}
