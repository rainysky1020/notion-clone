import { getPagesAction, getSettingsAction } from "@/app/actions/page.actions"
import { getAuthProvider } from "@/lib/auth"
import { ensureWorkspace } from "@/lib/seed/ensure-workspace"
import { Workspace } from "@/components/notion/workspace"

export default async function Page() {
  const session = await getAuthProvider().getSession()
  if (session) {
    await ensureWorkspace(session.user.id)
  }

  const [pages, settings] = await Promise.all([getPagesAction(), getSettingsAction()])

  return (
    <Workspace
      initialPages={pages}
      userName={session?.user.name}
      initialSettings={settings}
    />
  )
}
