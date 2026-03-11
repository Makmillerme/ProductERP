import { NextResponse } from "next/server";

const GOVERLA_URL = "https://api.goverla.ua/graphql";

const POINT_QUERY = `query Point($alias: Alias!) { point(alias: $alias) { id rates { id currency { alias name exponent codeAlpha codeNumeric __typename } bid { absolute relative updatedAt __typename } ask { absolute relative updatedAt __typename } __typename } updatedAt __typename } }`;

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const res = await fetch(GOVERLA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "VMD-Parser/1.0",
      },
      body: JSON.stringify({
        operationName: "Point",
        variables: { alias: "goverla-ua" },
        query: POINT_QUERY,
      }),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[api/currency/goverla]", res.status, text);
      return NextResponse.json(
        { error: `Goverla API: ${res.status}`, details: text },
        { status: res.status === 422 ? 502 : res.status }
      );
    }

    const json = await res.json();
    if (json.errors?.length) {
      return NextResponse.json(
        { error: json.errors[0]?.message ?? "Goverla API error" },
        { status: 502 }
      );
    }

    const rates = json.data?.point?.rates ?? [];
    return NextResponse.json(
      { rates },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    console.error("[api/currency/goverla]", e);
    return NextResponse.json(
      { error: "Помилка завантаження курсів" },
      { status: 500 }
    );
  }
}
