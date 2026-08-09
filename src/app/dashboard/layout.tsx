import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStoreSettings();
  return {
    title: `${name} — Dashboard`,
    description: "Manage products and view analytics for the virtual store",
  };
}

const NAV = [
  { href: "/dashboard", label: "Products" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 md:flex-row">
      {/* top bar on phones, sidebar from md up */}
      <aside className="flex shrink-0 flex-col border-b border-neutral-800 bg-neutral-900 p-4 md:w-56 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="mb-4 flex items-center gap-2 md:mb-8">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 shrink-0 rounded-md bg-neutral-800 object-contain"
            />
          ) : (
            <span className="text-lg">🛒</span>
          )}
          <span className="truncate text-lg font-semibold tracking-tight">
            {settings.name}
          </span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto text-sm md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-2 hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="shrink-0 rounded-md px-3 py-2 text-emerald-400 hover:bg-neutral-800 md:mt-4"
          >
            ↗ Open 3D store
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
