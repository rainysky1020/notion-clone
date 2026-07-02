"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth"
import {
  historyRepository,
  pageRepository,
  settingsRepository,
} from "@/lib/repositories/page.repository"
import { PAGE_TEMPLATES } from "@/lib/templates"
import type { Page, PageHistoryEntry, UserSettings } from "@/lib/types/notion"

export async function getPagesAction(): Promise<Page[]> {
  const session = await requireSession()
  return pageRepository.findAllByUserId(session.user.id)
}

export async function getFavoritePagesAction(): Promise<Page[]> {
  const session = await requireSession()
  return pageRepository.findFavoritesByUserId(session.user.id)
}

export async function getTrashedPagesAction(): Promise<Page[]> {
  const session = await requireSession()
  return pageRepository.findTrashedByUserId(session.user.id)
}

export async function getPageHistoryAction(pageId?: string): Promise<PageHistoryEntry[]> {
  const session = await requireSession()
  if (pageId) {
    return historyRepository.findByPageId(pageId, session.user.id)
  }
  return historyRepository.findByUserId(session.user.id)
}

export async function getSettingsAction(): Promise<UserSettings> {
  const session = await requireSession()
  return settingsRepository.getOrCreate(session.user.id, session.user.email)
}

export async function getTemplatesAction() {
  return PAGE_TEMPLATES
}

export async function createPageAction(parentId: string | null): Promise<Page | { error: string }> {
  try {
    const session = await requireSession()
    const page = await pageRepository.create(session.user.id, parentId)
    revalidatePath("/")
    return page
  } catch {
    return { error: "페이지를 생성할 수 없습니다." }
  }
}

export async function createPageFromTemplateAction(
  templateId: string,
): Promise<Page | { error: string }> {
  try {
    const session = await requireSession()
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return { error: "템플릿을 찾을 수 없습니다." }
    const page = await pageRepository.createFromTemplate(session.user.id, template)
    revalidatePath("/")
    return page
  } catch {
    return { error: "템플릿으로 페이지를 생성할 수 없습니다." }
  }
}

export async function updatePageAction(
  pageId: string,
  data: { title?: string; icon?: string },
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireSession()
    const ok = await pageRepository.update(pageId, session.user.id, data)
    if (!ok) return { error: "페이지를 찾을 수 없습니다." }

    if (data.title) {
      await historyRepository.record(
        session.user.id,
        pageId,
        "title_change",
        `제목을 "${data.title}"(으)로 변경했습니다`,
      )
    }
    if (data.icon) {
      await historyRepository.record(
        session.user.id,
        pageId,
        "icon_change",
        `아이콘을 ${data.icon}(으)로 변경했습니다`,
      )
    }

    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "페이지를 수정할 수 없습니다." }
  }
}

export async function toggleFavoriteAction(
  pageId: string,
): Promise<Page | { error: string }> {
  try {
    const session = await requireSession()
    const page = await pageRepository.toggleFavorite(pageId, session.user.id)
    if (!page) return { error: "페이지를 찾을 수 없습니다." }
    revalidatePath("/")
    return page
  } catch {
    return { error: "즐겨찾기를 변경할 수 없습니다." }
  }
}

export async function duplicatePageAction(pageId: string): Promise<Page | { error: string }> {
  try {
    const session = await requireSession()
    const page = await pageRepository.duplicate(pageId, session.user.id)
    if (!page) return { error: "페이지를 찾을 수 없습니다." }
    revalidatePath("/")
    return page
  } catch {
    return { error: "페이지를 복제할 수 없습니다." }
  }
}

export async function deletePageAction(pageId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireSession()
    const ok = await pageRepository.trash(pageId, session.user.id)
    if (!ok) return { error: "페이지를 찾을 수 없습니다." }
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "페이지를 삭제할 수 없습니다." }
  }
}

export async function restorePageAction(pageId: string): Promise<Page | { error: string }> {
  try {
    const session = await requireSession()
    const page = await pageRepository.restore(pageId, session.user.id)
    if (!page) return { error: "페이지를 찾을 수 없습니다." }
    revalidatePath("/")
    return page
  } catch {
    return { error: "페이지를 복원할 수 없습니다." }
  }
}

export async function permanentDeletePageAction(
  pageId: string,
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireSession()
    const ok = await pageRepository.permanentDelete(pageId, session.user.id)
    if (!ok) return { error: "페이지를 찾을 수 없습니다." }
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "페이지를 영구 삭제할 수 없습니다." }
  }
}

export async function emptyTrashAction(): Promise<{ count: number } | { error: string }> {
  try {
    const session = await requireSession()
    const count = await pageRepository.emptyTrash(session.user.id)
    revalidatePath("/")
    return { count }
  } catch {
    return { error: "휴지통을 비울 수 없습니다." }
  }
}

export async function updateSettingsAction(data: {
  name?: string
  theme?: "light" | "dark" | "system"
}): Promise<UserSettings | { error: string }> {
  try {
    const session = await requireSession()
    const settings = await settingsRepository.update(session.user.id, data)
    revalidatePath("/")
    return settings
  } catch {
    return { error: "설정을 저장할 수 없습니다." }
  }
}
