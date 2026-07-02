"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth"
import { blockRepository } from "@/lib/repositories/page.repository"
import type { BlockType } from "@/lib/types/notion"

export async function updateBlockAction(
  blockId: string,
  data: { content?: string; type?: BlockType; checked?: boolean },
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireSession()
    const block = await blockRepository.update(blockId, session.user.id, data)
    if (!block) return { error: "블록을 찾을 수 없습니다." }
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "블록을 수정할 수 없습니다." }
  }
}

export async function createBlockAction(
  pageId: string,
  type: BlockType = "text",
): Promise<{ id: string } | { error: string }> {
  try {
    const session = await requireSession()
    const block = await blockRepository.create(pageId, session.user.id, type)
    if (!block) return { error: "블록을 생성할 수 없습니다." }
    revalidatePath("/")
    return { id: block.id }
  } catch {
    return { error: "블록을 생성할 수 없습니다." }
  }
}
