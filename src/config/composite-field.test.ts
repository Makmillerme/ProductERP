import { describe, it, expect } from "vitest";
import {
  parseCompositePresetValues,
  stringifyCompositePresetValues,
} from "./composite-field";

describe("parseCompositePresetValues", () => {
  it("returns default for null", () => {
    const result = parseCompositePresetValues(null);
    expect(result.layout).toBe("row");
    expect(result.subFields).toEqual([]);
  });

  it("returns default for empty string", () => {
    const result = parseCompositePresetValues("");
    expect(result.subFields).toEqual([]);
  });

  it("returns default for invalid JSON", () => {
    const result = parseCompositePresetValues("not json");
    expect(result.subFields).toEqual([]);
  });

  it("parses valid composite config", () => {
    const json = '{"layout":"column","subFields":[{"code":"a","label":"A","widgetType":"text_input","dataType":"string"}]}';
    const result = parseCompositePresetValues(json);
    expect(result.layout).toBe("column");
    expect(result.subFields).toHaveLength(1);
    expect(result.subFields[0]).toEqual({
      code: "a",
      label: "A",
      widgetType: "text_input",
      dataType: "string",
    });
  });

  it("filters invalid subField items", () => {
    const json = '{"subFields":[{"code":"a","label":"A","widgetType":"text_input","dataType":"string"},null,{"code":"b"}]}';
    const result = parseCompositePresetValues(json);
    expect(result.subFields).toHaveLength(1);
    expect(result.subFields[0].code).toBe("a");
  });
});

describe("stringifyCompositePresetValues", () => {
  it("returns JSON string", () => {
    const config = {
      layout: "row" as const,
      subFields: [
        {
          code: "x",
          label: "X",
          widgetType: "number_input" as const,
          dataType: "integer" as const,
        },
      ],
    };
    const str = stringifyCompositePresetValues(config);
    expect(() => JSON.parse(str)).not.toThrow();
    expect(JSON.parse(str).layout).toBe("row");
  });
});
