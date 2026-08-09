import { getStoreSettings } from "@/lib/store-settings";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl">
        Store settings
      </h2>
      <p className="mb-6 text-sm text-neutral-400">
        The name and logo shown on the storefront door, the entry screen, and
        here in the dashboard.
      </p>
      <StoreSettingsForm settings={settings} />
    </div>
  );
}
