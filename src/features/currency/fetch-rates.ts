export type FetchRatesParams = {
  alias?: string;
};

function getRatesApiUrl(): string {
  if (typeof window !== "undefined") return "/api/currency/goverla";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  return `${base.startsWith("http") ? base : `https://${base}`}/api/currency/goverla`;
}

export async function fetchGoverlaRates(
  params?: FetchRatesParams
): Promise<{ rates: import("./api").GoverlaCurrency[] }> {
  void params; // Reserved for future filter/alias
  const url = getRatesApiUrl();
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string })?.error ?? `Goverla API: ${res.status}`;
    throw new Error(msg);
  }

  const json = (await res.json()) as { rates?: import("./api").GoverlaCurrency[] };
  const rates = json.rates ?? [];
  return { rates };
}
