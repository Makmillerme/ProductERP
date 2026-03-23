import { describe, it, expect } from "vitest";
import { validatePresetValuesForWidget } from "./validate-preset-values";

describe("validatePresetValuesForWidget", () => {
  it("returns null for non-preset widgets", () => {
    expect(validatePresetValuesForWidget("anything", "text_input")).toBeNull();
  });

  it("returns null for empty presetValues", () => {
    expect(validatePresetValuesForWidget(null, "select")).toBeNull();
    expect(validatePresetValuesForWidget("", "select")).toBeNull();
  });

  it("returns error for invalid JSON", () => {
    expect(validatePresetValuesForWidget("not json", "select")).toBe("Некоректний JSON");
  });

  it("validates select/radio/multiselect array and object format", () => {
    expect(validatePresetValuesForWidget('[{"value":"a","label":"A"}]', "select")).toBeNull();
    expect(validatePresetValuesForWidget('{"layout":"row","options":[{"value":"a","label":"A"}]}', "radio")).toBeNull();
    expect(validatePresetValuesForWidget('{"layout":"column","options":[{"value":"x"}]}', "multiselect")).toBeNull();
    expect(validatePresetValuesForWidget('{"x":1}', "select")).toBe(
      "Некоректний формат: очікується JSON масив або об'єкт { options: [...] }"
    );
    expect(validatePresetValuesForWidget('[{"value":"","label":"X"}]', "select")).toBe(
      "Кожен елемент має містити непусте value"
    );
    expect(
      validatePresetValuesForWidget('[{"value":"a","label":"A"},{"value":"a","label":"B"}]', "select")
    ).toBe("Значення опцій мають бути унікальними");
  });

  it("validates file_upload folders", () => {
    expect(
      validatePresetValuesForWidget(
        '{"folders":[{"code":"01","label":"Folder"}]}',
        "file_upload"
      )
    ).toBeNull();
    expect(
      validatePresetValuesForWidget(
        '{"folders":[{"code":"01","label":"Folder","maxFiles":5}]}',
        "file_upload"
      )
    ).toBeNull();
    expect(validatePresetValuesForWidget('{"folders":[]}', "file_upload")).toBeNull();
    expect(validatePresetValuesForWidget('{"x":1}', "file_upload")).toBe(
      "Некоректний формат: очікується масив folders"
    );
    expect(
      validatePresetValuesForWidget(
        '{"folders":[{"code":"a","label":"A"},{"code":"a","label":"B"}]}',
        "file_upload"
      )
    ).toBe("Дублікат коду папки: a");
  });

  it("validates composite subFields", () => {
    expect(
      validatePresetValuesForWidget(
        '{"layout":"row","subFields":[{"code":"a","label":"A","widgetType":"text_input","dataType":"string"}]}',
        "composite"
      )
    ).toBeNull();
    expect(
      validatePresetValuesForWidget(
        '{"subFields":[{"code":"a","label":"A","widgetType":"text_input","dataType":"string"},{"code":"a","label":"B","widgetType":"number_input","dataType":"integer"}]}',
        "composite"
      )
    ).toBe("Дублікат коду підполя: a");
  });
});
