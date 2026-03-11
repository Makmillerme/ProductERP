# TextInput та TextareaField — валідація (впроваджено 2025-02-23)

## TextInput
- required, error, pattern, patternMessage
- format presets: any, email, url, phone, slug, custom
- getTextValidationPattern(format, pattern) — повертає regex
- patternMessage — title для HTML5 validation tooltip

## TextareaField
- required, error
- Без format/pattern (вільний текст)

## field-constructor
- TEXT_FORMAT_PRESETS, getTextValidationPattern
- string validation: format (select), pattern, patternMessage
- inputType: "select" з selectOptions

## Фільтри
- textarea: приховати format, pattern, patternMessage
- text_input: приховати minRows, maxRows