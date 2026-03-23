import { describe, it, expect } from "vitest";
import {
  parsePresetValues,
  parseOptionsWithLayout,
  stringifyOptionsWithLayout,
  evaluateFormula,
  validateFormula,
  extractFormulaSlugs,
  parseDateValue,
  formatDateToYyyyMmDd,
  formatDateForStorage,
} from "./field-utils";

describe("parsePresetValues", () => {
  it("returns empty array for null", () => {
    expect(parsePresetValues(null)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parsePresetValues("")).toEqual([]);
  });

  it("parses valid JSON array with value", () => {
    expect(parsePresetValues('[{"value":"a","label":"A"}]')).toEqual([
      { value: "a", label: "A" },
    ]);
  });

  it("filters items without value", () => {
    const result = parsePresetValues('[{"value":"a"},{"label":"B"},{"value":"c","label":"C"}]');
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe("a");
    expect(result[1]).toEqual({ value: "c", label: "C" });
  });

  it("returns empty array for invalid JSON", () => {
    expect(parsePresetValues("not json")).toEqual([]);
  });

  it("returns empty array for non-array", () => {
    expect(parsePresetValues('{"value":"a"}')).toEqual([]);
  });

  it("parses object format with layout and options (radio/multiselect)", () => {
    const result = parsePresetValues('{"layout":"column","options":[{"value":"a","label":"A"}]}');
    expect(result).toEqual([{ value: "a", label: "A" }]);
  });
});

describe("parseOptionsWithLayout", () => {
  it("parses legacy array as row layout", () => {
    const result = parseOptionsWithLayout('[{"value":"a","label":"A"}]');
    expect(result.layout).toBe("row");
    expect(result.options).toEqual([{ value: "a", label: "A" }]);
  });

  it("parses object format with column layout", () => {
    const result = parseOptionsWithLayout('{"layout":"column","options":[{"value":"x","label":"X"}]}');
    expect(result.layout).toBe("column");
    expect(result.options).toEqual([{ value: "x", label: "X" }]);
  });
});

describe("stringifyOptionsWithLayout", () => {
  it("returns empty string for empty options", () => {
    expect(stringifyOptionsWithLayout("row", [])).toBe("");
  });

  it("serializes layout and options", () => {
    const str = stringifyOptionsWithLayout("column", [{ value: "a", label: "A" }]);
    const parsed = JSON.parse(str);
    expect(parsed.layout).toBe("column");
    expect(parsed.options).toEqual([{ value: "a", label: "A" }]);
  });
});

describe("evaluateFormula", () => {
  it("returns null for empty formula", () => {
    expect(evaluateFormula(null, {})).toBeNull();
    expect(evaluateFormula("", {})).toBeNull();
  });

  it("evaluates simple expression", () => {
    expect(evaluateFormula("1+2", {})).toBe("3");
  });

  it("substitutes slugs with product values", () => {
    expect(evaluateFormula("{x}+{y}", { x: 10, y: 5 })).toBe("15");
  });

  it("returns null for invalid expression", () => {
    expect(evaluateFormula("alert(1)", {})).toBeNull();
  });
});

describe("validateFormula", () => {
  it("returns error for empty formula", () => {
    expect(validateFormula(null)).toBe("Вкажіть формулу");
    expect(validateFormula("")).toBe("Вкажіть формулу");
    expect(validateFormula("   ")).toBe("Вкажіть формулу");
  });

  it("returns null for pure numeric formula without slugs", () => {
    expect(validateFormula("1+2")).toBeNull();
    expect(validateFormula("100")).toBeNull();
  });

  it("returns null for valid formula", () => {
    expect(validateFormula("{a}+{b}")).toBeNull();
    expect(validateFormula("{payload_kg}+{gross_weight_kg}")).toBeNull();
    expect(validateFormula("({x}*{y})/100")).toBeNull();
  });

  it("returns error for invalid syntax", () => {
    expect(validateFormula("{a}+")).not.toBeNull();
  });

  it("returns error for disallowed chars", () => {
    expect(validateFormula("{a}+alert(1)")).not.toBeNull();
  });
});

describe("extractFormulaSlugs", () => {
  it("extracts unique slugs", () => {
    expect(extractFormulaSlugs("{a}+{b}+{a}")).toEqual(["a", "b"]);
  });
});

describe("parseDateValue", () => {
  it("returns undefined for empty", () => {
    expect(parseDateValue(null)).toBeUndefined();
    expect(parseDateValue("")).toBeUndefined();
  });

  it("parses ISO date", () => {
    const d = parseDateValue("2025-02-23");
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(1);
  });

  it("parses ISO datetime", () => {
    const d = parseDateValue("2025-02-23T10:30:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d?.getUTCFullYear()).toBe(2025);
    expect(d?.getUTCMonth()).toBe(1);
    expect(d?.getUTCDate()).toBe(23);
    expect(d?.getUTCHours()).toBe(10);
    expect(d?.getUTCMinutes()).toBe(30);
  });
});

describe("formatDateToYyyyMmDd", () => {
  it("returns null for invalid", () => {
    expect(formatDateToYyyyMmDd(undefined)).toBeNull();
  });

  it("formats date", () => {
    expect(formatDateToYyyyMmDd(new Date(2025, 1, 23))).toBe("2025-02-23");
  });
});

describe("formatDateForStorage", () => {
  it("returns null for invalid", () => {
    expect(formatDateForStorage(undefined, "date")).toBeNull();
    expect(formatDateForStorage(undefined, "datetime")).toBeNull();
  });

  it("formats date mode as YYYY-MM-DD", () => {
    expect(formatDateForStorage(new Date(2025, 1, 23), "date")).toBe("2025-02-23");
  });

  it("formats datetime mode as ISO string with time", () => {
    const d = new Date(Date.UTC(2025, 1, 23, 10, 30, 0));
    const result = formatDateForStorage(d, "datetime");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(result).toContain("2025");
    expect(result).toContain("02");
    expect(result).toContain("23");
  });
});
