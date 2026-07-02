import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-lg font-semibold text-background">
            W
          </div>
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="mt-1 text-sm text-muted-foreground">Google 계정으로 워크스페이스에 접속하세요</p>
        </div>
        {error && (
          <p className="mb-4 text-center text-sm text-destructive">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    </div>
  )
}
