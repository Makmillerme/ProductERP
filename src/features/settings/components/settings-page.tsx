"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";
import { getRoleLabel } from "@/config/roles";
import { useLocale } from "@/lib/locale-provider";
import { LOCALES, type Locale } from "@/lib/i18n";

const TAB_VALUES = ["profile", "settings"] as const;

export function SettingsPage() {
  const { t } = useLocale();
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "profile",
    parse: (v) => (TAB_VALUES.includes(v as (typeof TAB_VALUES)[number]) ? (v as (typeof TAB_VALUES)[number]) : "profile"),
    serialize: (v) => v,
  });
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TAB_VALUES)[number])} className="w-full">
        <TabsList variant="line" className="w-full max-w-md">
          <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="settings">{t("settings.title")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab session={session} t={t} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({
  session,
  t,
}: {
  session: { user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null } } | null | undefined;
  t: (key: string) => string;
}) {
  if (!session?.user) {
    return (
      <p className="text-muted-foreground">
        {t("settings.profileSignInPrompt")}
      </p>
    );
  }
  const u = session.user;
  const roleLabel = getRoleLabel(u.role);
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-muted-foreground">{t("settings.profileName")}</p>
        <p className="text-base">{u.name ?? "—"}</p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium text-muted-foreground">{t("settings.profileEmail")}</p>
        <p className="text-base">{u.email ?? "—"}</p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium text-muted-foreground">{t("settings.profileRole")}</p>
        <p className="text-base">{roleLabel}</p>
      </div>
        {u.image && (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-muted-foreground">{t("settings.profileAvatar")}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.image} alt="" className="h-16 w-16 rounded-full object-cover" />
          </div>
        )}
    </div>
  );
}

function SettingsTab({ t }: { t: (key: string) => string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <p className="text-muted-foreground">
        {t("settings.settingsDescription")}
      </p>
      <div className="grid gap-2">
        <Label htmlFor="locale-select">{t("settings.language")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("settings.languageDescription")}
        </p>
        <Select
          value={locale}
          onValueChange={(v) => setLocale(v as Locale)}
        >
          <SelectTrigger id="locale-select" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
