/**
 * Типи відповіді API Говерла (курси валют).
 * data.point.rates[] -> bid.absolute (покупка), ask.absolute (продаж), currency
 */
export type GoverlaCurrency = {
  id: string;
  currency: {
    alias: string;
    name: string;
    exponent: number;
    codeAlpha: string;
    codeNumeric: string;
    __typename?: string;
  };
  bid: {
    absolute: number;
    relative: number | null;
    updatedAt: string | null;
    __typename?: string;
  };
  ask: {
    absolute: number;
    relative: number | null;
    updatedAt: string | null;
    __typename?: string;
  };
  updatedAt: string | null;
  __typename?: string;
};

export type GoverlaPointResponse = {
  data?: {
    point?: {
      id: string;
      rates: GoverlaCurrency[];
      updatedAt: string | null;
      __typename?: string;
    };
  };
  errors?: Array<{ message: string }>;
};
