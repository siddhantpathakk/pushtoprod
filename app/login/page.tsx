import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ClarionMark } from "@/app/_components/Brand";

export const metadata = {
  title: "Sign in · Clarion",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <ClarionMark
              size="lg"
              className="text-stone-900 dark:text-stone-100"
            />
            <div className="flex flex-col items-center gap-1">
              <h1 className="font-medium tracking-tight text-2xl">Clarion</h1>
              <p className="text-sm text-stone-500 leading-relaxed">
                Clarity from the chaos.
              </p>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="w-full inline-flex items-center justify-center gap-3 rounded-md bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            <GoogleMark />
            Continue with Google
          </a>

          {error ? (
            <p
              role="alert"
              className="text-xs text-red-500 dark:text-red-400"
            >
              Sign-in failed ({error}). Please try again.
            </p>
          ) : null}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-stone-400 dark:text-stone-600">
        By continuing you agree to let Clarion read your inbox, gently.
      </footer>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#FFFFFF"
        d="M21.35 11.1h-9.17v2.91h5.27c-.23 1.47-1.65 4.31-5.27 4.31-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 3.98 14.73 3 12.18 3 7.12 3 3 7.12 3 12.19s4.12 9.19 9.18 9.19c5.3 0 8.82-3.73 8.82-8.97 0-.6-.07-1.06-.15-1.31z"
      />
    </svg>
  );
}
