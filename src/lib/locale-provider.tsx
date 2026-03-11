"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { t as tBase, tFormat as tFormatBase, type Locale } from "./i18n";

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return "uk";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  const value = match?.[1]?.trim();
  return value === "en" ? "en" : "uk";
}

function setLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tFormat: (key: string, params: Record<string, string>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uk");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = useCallback(
    (key: string) => tBase(key, mounted ? locale : "uk"),
    [locale, mounted]
  );

  const tFormat = useCallback(
    (key: string, params: Record<string, string>) =>
      tFormatBase(key, params, mounted ? locale : "uk"),
    [locale, mounted]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tFormat }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "uk" as Locale,
      setLocale: () => {},
      t: (key: string) => tBase(key, "uk"),
      tFormat: (key: string, params: Record<string, string>) =>
        tFormatBase(key, params, "uk"),
    };
  }
  return ctx;
}
