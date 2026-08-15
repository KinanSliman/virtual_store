import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/lib/store-settings";
import { isAuthConfigured } from "@/lib/auth";
import { LoginForm } from "@/components/dashboard/login-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStoreSettings();
  return { title: `Sign in — ${name}` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-viewport items-center justify-center bg-neutral-950 p-4 text-neutral-100">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">{settings.name}</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Sign in to manage the catalogue.
        </p>

        {isAuthConfigured() ? (
          <LoginForm next={next} />
        ) : (
          <p className="rounded-md border border-amber-900 bg-amber-950 px-3 py-2 text-sm text-amber-300">
            No dashboard password is configured. Set{" "}
            <code className="rounded bg-black/40 px-1">DASHBOARD_PASSWORD</code>{" "}
            on the server and reload.
          </p>
        )}

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← Back to the store
        </Link>
      </div>
    </div>
  );
}
