import type { Block, BlockType, Page } from "@/lib/types/notion"

const blockTypeToDomain: Record<string, BlockType> = {
  TEXT: "text",
  H1: "h1",
  H2: "h2",
  H3: "h3",
  BULLET: "bullet",
  TODO: "todo",
  QUOTE: "quote",
}

export const blockTypeToDb: Record<BlockType, string> = {
  text: "TEXT",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  bullet: "BULLET",
  todo: "TODO",
  quote: "QUOTE",
}

type DbBlock = {
  id: string
  type: string
  content: string
  checked: boolean
  sort_order?: number
}

type DbPage = {
  id: string
  icon: string
  title: string
  parent_id: string | null
  is_favorite: boolean
  is_trashed: boolean
  trashed_at: string | null
  updated_at: string
  blocks?: DbBlock[]
}

export function mapBlock(block: DbBlock): Block {
  return {
    id: block.id,
    type: blockTypeToDomain[block.type] ?? "text",
    content: block.content,
    checked: block.checked,
  }
}

export function mapPage(page: DbPage): Page {
  const blocks = (page.blocks ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return {
    id: page.id,
    icon: page.icon,
    title: page.title,
    parentId: page.parent_id,
    isFavorite: page.is_favorite,
    isTrashed: page.is_trashed,
    trashedAt: page.trashed_at,
    blocks: blocks.map(mapBlock),
    updatedAt: page.updated_at,
  }
}

export async function attachBlocksToPages(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  pages: Omit<DbPage, "blocks">[],
): Promise<DbPage[]> {
  if (pages.length === 0) return []

  const pageIds = pages.map((p) => p.id)
  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .in("page_id", pageIds)
    .order("sort_order", { ascending: true })

  const blocksByPage = new Map<string, DbBlock[]>()
  for (const block of blocks ?? []) {
    const list = blocksByPage.get(block.page_id) ?? []
    list.push(block)
    blocksByPage.set(block.page_id, list)
  }

  return pages.map((page) => ({
    ...page,
    blocks: blocksByPage.get(page.id) ?? [],
  }))
}
