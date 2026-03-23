"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import { useGoverlaRates } from "./use-rates";
import type { GoverlaCurrency } from "./api";

const CURRENCY_CODES = ["USD", "EUR"] as const;

function formatRate(rawValue: number): string {
  const value = rawValue / 100;
  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Формат зміни курсу (абсолютне значення): як на Говерлі — 0.07, 0.01 */
function formatRelative(raw: number): string {
  const abs = Math.abs(raw);
  return abs >= 1 ? (abs / 100).toFixed(2) : abs.toFixed(2);
}

/** Як на Говерлі: зростання — зелений ↑, падіння — червоний ↓ + значення зміни */
function TrendIndicator({ relative }: { relative: number | null }) {
  const { t, tFormat } = useLocale();
  if (relative == null || relative === 0) return null;
  const isUp = relative > 0;
  const value = formatRelative(relative);
  return (
    <span
      className="inline-flex items-center gap-0.5 tabular-nums"
      title={isUp ? t("currency.rateUp") : t("currency.rateDown")}
      aria-label={isUp ? tFormat("currency.rateUpBy", { value }) : tFormat("currency.rateDownBy", { value })}
    >
      {isUp ? (
        <>
          <TrendingUp className="size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400">{value}</span>
        </>
      ) : (
        <>
          <TrendingDown className="size-3.5 shrink-0 text-red-500 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">{value}</span>
        </>
      )}
    </span>
  );
}

function filterUsdEur(rates: GoverlaCurrency[]): GoverlaCurrency[] {
  return rates
    .filter((r) =>
      CURRENCY_CODES.includes(r.currency.codeAlpha as (typeof CURRENCY_CODES)[number])
    )
    .sort((a, b) => {
      const i = CURRENCY_CODES.indexOf(a.currency.codeAlpha as (typeof CURRENCY_CODES)[number]);
      const j = CURRENCY_CODES.indexOf(b.currency.codeAlpha as (typeof CURRENCY_CODES)[number]);
      return i - j;
    });
}

export function CurrencyRatesHeader() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useGoverlaRates();
  const rates = filterUsdEur(data?.rates ?? []);

  if (isLoading) {
    return (
      <span className="shrink-0 text-xs text-emerald-500 dark:text-emerald-400" aria-hidden>
        {t("currency.loading")}
      </span>
    );
  }
  if (isError || rates.length === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
      {rates.map((rate, index) => (
        <span key={rate.id} className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
          {index > 0 && (
            <span className="text-emerald-400/70 dark:text-emerald-300/70" aria-hidden>
              •
            </span>
          )}
          <TrendIndicator relative={rate.bid.relative ?? rate.ask.relative ?? null} />
          <span className="font-medium">{rate.currency.codeAlpha}</span>
          <span className="text-emerald-500/90 dark:text-emerald-400/90">
            {formatRate(rate.bid.absolute)}
            <span className="mx-0.5 text-emerald-500/75 dark:text-emerald-400/75">/</span>
            {formatRate(rate.ask.absolute)}
          </span>
        </span>
      ))}
    </div>
  );
}

