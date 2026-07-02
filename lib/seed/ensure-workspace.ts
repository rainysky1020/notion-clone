import { createClient } from "@/lib/supabase/server"

export async function ensureWorkspace(userId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (count && count > 0) return

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      user_id: userId,
      icon: "👋",
      title: "시작하기",
      sort_order: 0,
    })
    .select()
    .single()

  if (error || !page) return

  await supabase.from("blocks").insert([
    {
      page_id: page.id,
      type: "TEXT",
      content:
        "이 워크스페이스에 오신 것을 환영합니다. 왼쪽에서 페이지를 만들고, 정리하고, 삭제해 보세요.",
      sort_order: 0,
    },
    { page_id: page.id, type: "H2", content: "기본 사용법", sort_order: 1 },
    {
      page_id: page.id,
      type: "BULLET",
      content: "사이드바에서 페이지를 클릭해 이동합니다.",
      sort_order: 2,
    },
    {
      page_id: page.id,
      type: "BULLET",
      content: "각 항목에 마우스를 올리면 추가/삭제 버튼이 나타납니다.",
      sort_order: 3,
    },
    {
      page_id: page.id,
      type: "TODO",
      content: "첫 번째 페이지 만들어 보기",
      checked: true,
      sort_order: 4,
    },
    {
      page_id: page.id,
      type: "TODO",
      content: "할 일 목록 작성하기",
      checked: false,
      sort_order: 5,
    },
    {
      page_id: page.id,
      type: "QUOTE",
      content: "작은 단위로 생각을 정리하면 큰 그림이 보입니다.",
      sort_order: 6,
    },
  ])

  await supabase.from("page_history").insert({
    user_id: userId,
    page_id: page.id,
    action: "created",
    summary: "워크스페이스를 시작했습니다",
  })
}
