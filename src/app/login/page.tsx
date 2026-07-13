import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
          Google로 로그인
        </button>
      </form>
    </div>
  );
}
