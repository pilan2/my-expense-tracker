import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>{session?.user?.email} 님, 환영합니다.</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="text-sm underline">
          로그아웃
        </button>
      </form>
    </div>
  );
}
