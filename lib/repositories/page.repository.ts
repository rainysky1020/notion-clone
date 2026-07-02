import { createClient } from "@/lib/supabase/server"
import { attachBlocksToPages, blockTypeToDb, mapPage } from "@/lib/mappers/page.mapper"
import type { BlockType } from "@/lib/types/notion"
import type { PageTemplate } from "@/lib/templates"

async function getSupabase() {
  return createClient()
}

async function fetchPageWithBlocks(pageId: string, userId: string, extraFilter: Record<string, unknown> = {}) {
  const supabase = await getSupabase()
  let query = supabase.from("pages").select("*").eq("id", pageId).eq("user_id", userId)
  for (const [key, value] of Object.entries(extraFilter)) {
    query = query.eq(key, value)
  }
  const { data: page } = await query.single()
  if (!page) return null

  const [withBlocks] = await attachBlocksToPages(supabase, [page])
  return mapPage(withBlocks)
}

export const historyRepository = {
  async record(userId: string, pageId: string, action: string, summary: string) {
    const supabase = await getSupabase()
    await supabase.from("page_history").insert({ user_id: userId, page_id: pageId, action, summary })
  },

  async findByUserId(userId: string, limit = 50) {
    const supabase = await getSupabase()
    const { data: entries } = await supabase
      .from("page_history")
      .select("*, pages(title, icon, is_trashed)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    return (entries ?? []).map((e) => ({
      id: e.id,
      pageId: e.page_id,
      pageTitle: e.pages?.title ?? "",
      pageIcon: e.pages?.icon ?? "📄",
      action: e.action,
      summary: e.summary,
      createdAt: e.created_at,
    }))
  },

  async findByPageId(pageId: string, userId: string, limit = 30) {
    const supabase = await getSupabase()
    const { data: entries } = await supabase
      .from("page_history")
      .select("*, pages(title, icon)")
      .eq("page_id", pageId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    return (entries ?? []).map((e) => ({
      id: e.id,
      pageId: e.page_id,
      pageTitle: e.pages?.title ?? "",
      pageIcon: e.pages?.icon ?? "📄",
      action: e.action,
      summary: e.summary,
      createdAt: e.created_at,
    }))
  },
}

export const settingsRepository = {
  async getOrCreate(userId: string, email = "") {
    const supabase = await getSupabase()
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    return {
      name: profile?.name ?? null,
      email,
      theme: (profile?.theme ?? "system") as "light" | "dark" | "system",
    }
  },

  async update(userId: string, data: { name?: string; theme?: string }) {
    const supabase = await getSupabase()
    const updates: Record<string, string> = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.theme !== undefined) updates.theme = data.theme
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", userId)
    }
    const session = await supabase.auth.getUser()
    return this.getOrCreate(userId, session.data.user?.email ?? "")
  },
}

export const pageRepository = {
  async findAllByUserId(userId: string) {
    const supabase = await getSupabase()
    const { data: pages } = await supabase
      .from("pages")
      .select("*")
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    const withBlocks = await attachBlocksToPages(supabase, pages ?? [])
    return withBlocks.map(mapPage)
  },

  async findTrashedByUserId(userId: string) {
    const supabase = await getSupabase()
    const { data: pages } = await supabase
      .from("pages")
      .select("*")
      .eq("user_id", userId)
      .eq("is_trashed", true)
      .order("trashed_at", { ascending: false })

    const withBlocks = await attachBlocksToPages(supabase, pages ?? [])
    return withBlocks.map(mapPage)
  },

  async findFavoritesByUserId(userId: string) {
    const supabase = await getSupabase()
    const { data: pages } = await supabase
      .from("pages")
      .select("*")
      .eq("user_id", userId)
      .eq("is_favorite", true)
      .eq("is_trashed", false)
      .order("updated_at", { ascending: false })

    const withBlocks = await attachBlocksToPages(supabase, pages ?? [])
    return withBlocks.map(mapPage)
  },

  async findByIdForUser(pageId: string, userId: string) {
    return fetchPageWithBlocks(pageId, userId, { is_trashed: false })
  },

  async create(userId: string, parentId: string | null) {
    const supabase = await getSupabase()
    const { count } = await supabase
      .from("pages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .is("parent_id", parentId)

    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        user_id: userId,
        parent_id: parentId,
        sort_order: count ?? 0,
      })
      .select()
      .single()

    if (error || !page) throw error ?? new Error("Failed to create page")

    await supabase.from("blocks").insert({
      page_id: page.id,
      type: "TEXT",
      content: "",
      sort_order: 0,
    })

    await historyRepository.record(userId, page.id, "created", "새 페이지를 만들었습니다")
    return fetchPageWithBlocks(page.id, userId) as Promise<ReturnType<typeof mapPage>>
  },

  async createFromTemplate(userId: string, template: PageTemplate, parentId: string | null = null) {
    const supabase = await getSupabase()
    const { count } = await supabase
      .from("pages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .is("parent_id", parentId)

    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        user_id: userId,
        parent_id: parentId,
        icon: template.icon,
        title: template.title,
        sort_order: count ?? 0,
      })
      .select()
      .single()

    if (error || !page) throw error ?? new Error("Failed to create page")

    await supabase.from("blocks").insert(
      template.blocks.map((b, i) => ({
        page_id: page.id,
        type: blockTypeToDb[b.type],
        content: b.content,
        checked: b.checked ?? false,
        sort_order: i,
      })),
    )

    await historyRepository.record(
      userId,
      page.id,
      "template",
      `템플릿 "${template.name}"으로 페이지를 만들었습니다`,
    )
    return fetchPageWithBlocks(page.id, userId) as Promise<ReturnType<typeof mapPage>>
  },

  async duplicate(pageId: string, userId: string) {
    const source = await fetchPageWithBlocks(pageId, userId, { is_trashed: false })
    if (!source) return null

    const supabase = await getSupabase()
    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        user_id: userId,
        parent_id: source.parentId,
        icon: source.icon,
        title: `${source.title} (복사본)`,
        sort_order: 0,
      })
      .select()
      .single()

    if (error || !page) return null

    await supabase.from("blocks").insert(
      source.blocks.map((b, i) => ({
        page_id: page.id,
        type: blockTypeToDb[b.type],
        content: b.content,
        checked: b.checked ?? false,
        sort_order: i,
      })),
    )

    await historyRepository.record(userId, page.id, "duplicated", `"${source.title}" 페이지를 복제했습니다`)
    return fetchPageWithBlocks(page.id, userId)
  },

  async update(
    pageId: string,
    userId: string,
    data: { title?: string; icon?: string; parentId?: string | null; isFavorite?: boolean },
  ) {
    const supabase = await getSupabase()
    const updates: Record<string, unknown> = {}
    if (data.title !== undefined) updates.title = data.title
    if (data.icon !== undefined) updates.icon = data.icon
    if (data.parentId !== undefined) updates.parent_id = data.parentId
    if (data.isFavorite !== undefined) updates.is_favorite = data.isFavorite

    const { data: rows, error } = await supabase
      .from("pages")
      .update(updates)
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .select("id")

    return !error && (rows?.length ?? 0) > 0
  },

  async toggleFavorite(pageId: string, userId: string) {
    const supabase = await getSupabase()
    const { data: page } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .single()

    if (!page) return null

    const isFavorite = !page.is_favorite
    await supabase.from("pages").update({ is_favorite: isFavorite }).eq("id", pageId)

    await historyRepository.record(
      userId,
      pageId,
      isFavorite ? "favorited" : "unfavorited",
      isFavorite
        ? `"${page.title}"을(를) 즐겨찾기에 추가했습니다`
        : `"${page.title}"을(를) 즐겨찾기에서 제거했습니다`,
    )
    return fetchPageWithBlocks(pageId, userId)
  },

  async trash(pageId: string, userId: string) {
    const supabase = await getSupabase()
    const { data: page } = await supabase
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .single()

    if (!page) return false

    const idsToTrash = new Set<string>()
    const collect = async (id: string) => {
      idsToTrash.add(id)
      const { data: children } = await supabase
        .from("pages")
        .select("id")
        .eq("parent_id", id)
        .eq("user_id", userId)
        .eq("is_trashed", false)

      await Promise.all((children ?? []).map((c) => collect(c.id)))
    }
    await collect(pageId)

    await supabase
      .from("pages")
      .update({ is_trashed: true, trashed_at: new Date().toISOString(), is_favorite: false })
      .in("id", [...idsToTrash])
      .eq("user_id", userId)

    await historyRepository.record(userId, pageId, "trashed", `"${page.title}"을(를) 휴지통으로 이동했습니다`)
    return true
  },

  async restore(pageId: string, userId: string) {
    const supabase = await getSupabase()
    const { data: page } = await supabase
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", true)
      .single()

    if (!page) return null

    await supabase
      .from("pages")
      .update({ is_trashed: false, trashed_at: null })
      .eq("id", pageId)

    await historyRepository.record(userId, pageId, "restored", `"${page.title}"을(를) 복원했습니다`)
    return fetchPageWithBlocks(pageId, userId)
  },

  async permanentDelete(pageId: string, userId: string) {
    const supabase = await getSupabase()
    const { data: page } = await supabase
      .from("pages")
      .select("id")
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", true)
      .single()

    if (!page) return false

    await supabase.from("pages").delete().eq("id", pageId)
    return true
  },

  async emptyTrash(userId: string) {
    const supabase = await getSupabase()
    const { data: trashed } = await supabase
      .from("pages")
      .select("id")
      .eq("user_id", userId)
      .eq("is_trashed", true)

    if (!trashed?.length) return 0

    await supabase
      .from("pages")
      .delete()
      .eq("user_id", userId)
      .eq("is_trashed", true)

    return trashed.length
  },

  async delete(pageId: string, userId: string) {
    return this.trash(pageId, userId)
  },
}

export const blockRepository = {
  async update(
    blockId: string,
    userId: string,
    data: { content?: string; type?: BlockType; checked?: boolean },
  ) {
    const supabase = await getSupabase()
    const { data: block } = await supabase.from("blocks").select("page_id").eq("id", blockId).single()
    if (!block) return null

    const { data: page } = await supabase
      .from("pages")
      .select("id")
      .eq("id", block.page_id)
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .single()

    if (!page) return null

    const updates: Record<string, unknown> = {}
    if (data.content !== undefined) updates.content = data.content
    if (data.type !== undefined) updates.type = blockTypeToDb[data.type]
    if (data.checked !== undefined) updates.checked = data.checked

    const { data: updated } = await supabase
      .from("blocks")
      .update(updates)
      .eq("id", blockId)
      .select()
      .single()

    return updated
  },

  async create(pageId: string, userId: string, type: BlockType = "text") {
    const supabase = await getSupabase()
    const { data: page } = await supabase
      .from("pages")
      .select("id")
      .eq("id", pageId)
      .eq("user_id", userId)
      .eq("is_trashed", false)
      .single()

    if (!page) return null

    const { count } = await supabase
      .from("blocks")
      .select("*", { count: "exact", head: true })
      .eq("page_id", pageId)

    const { data: block } = await supabase
      .from("blocks")
      .insert({
        page_id: pageId,
        type: blockTypeToDb[type],
        content: "",
        sort_order: count ?? 0,
      })
      .select()
      .single()

    return block
  },
}
