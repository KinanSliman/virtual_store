import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Store Dashboard",
  description: "Manage products and view analytics for the virtual store",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900 p-4">
        <h1 className="mb-8 text-lg font-semibold tracking-tight">
          🛒 Virtual Store
        </h1>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 hover:bg-neutral-800"
          >
            Products
          </Link>
          <Link
            href="/dashboard/analytics"
            className="rounded-md px-3 py-2 hover:bg-neutral-800"
          >
            Analytics
          </Link>
          <Link
            href="/"
            className="mt-4 rounded-md px-3 py-2 text-emerald-400 hover:bg-neutral-800"
          >
            ↗ Open 3D store
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
