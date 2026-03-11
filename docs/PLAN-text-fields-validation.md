# План: Модернізація текстових полів (TextInput, TextareaField)

**Дата:** 2025-02-23

## Контекст

- **Текстовий рядок (TextInput):** короткий текст, одне значення. Валідація за типом (email, url, phone, pattern).
- **Текстове поле (TextareaField):** багато тексту, вільний вміст. Тільки загальна валідація (length, rows, required).

---

## Крок 1: Розширити TextInput

**Що додати:**
- `required` — зірочка *, атрибут required
- `error` — текст помилки під полем
- `pattern` — regex для перевірки формату
- `patternMessage` — повідомлення при невідповідності pattern

**Логіка:** Коли pattern заданий — валідуємо на клієнті (HTML5 pattern + опційно onBlur). error передається з батька (форма).

---

## Крок 2: Розширити TextareaField

**Що додати:**
- `required` — зірочка *, атрибут required
- `error` — текст помилки під полем

**Без pattern** — текстове поле приймає будь-який текст.

---

## Крок 3: Типи формату для TextInput

**Опції в налаштуваннях поля:**
- `format`: "any" | "email" | "url" | "phone" | "slug" | "custom"
- `pattern` — тільки коли format === "custom"
- `patternMessage` — повідомлення при помилці

**Пресети regex:**
- email: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- url: `^https?://[^\s]+$`
- phone: `^[+]?[\d\s\-()]{10,}$`
- slug: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

---

## Крок 4: field-constructor

**Зміни:**
- Додати до string validation: `format` (select), `pattern` (text), `patternMessage` (text)
- `format` показувати тільки для text_input (фільтр у field-definitions-management)
- `pattern`, `patternMessage` — тільки для text_input, коли format === "custom"

**Спрощення:** Зробити format і pattern окремими опціями. format = preset, pattern = custom regex. Якщо format заданий — використовуємо preset. Якщо pattern заданий — custom. Пріоритет: pattern > format.

---

## Крок 5: field-definitions-management

**Зміни:**
- Коли `widgetType === "textarea"` — фільтрувати format, pattern, patternMessage з опцій
- Додати рендер для format (Select з опціями)
- pattern, patternMessage показувати коли format === "custom" або pattern заданий

---

## Крок 6: dynamic-field-renderer

**Зміни:**
- TextInput (основне + composite): передавати required, error, pattern (обчислений з format або pattern), patternMessage
- TextareaField: передавати required, error
- Composite text_input: те саме
- Composite textarea: required, error

---

## Крок 7: buildValidationJson / parseValidationJson

- Додати format, pattern, patternMessage
- Фільтрувати format "any" та порожні pattern

---

## Ризики

- Існуючі поля без format/pattern — працюють як раніше (required вже є)
- Regex у pattern — можливі помилки при невалідному regex; обгортати в try/catch

---

## Порядок впровадження

1. TextInput: required, error, pattern, patternMessage
2. TextareaField: required, error
3. field-constructor: format, pattern, patternMessage для string
4. buildValidationJson / parseValidationJson
5. field-definitions-management: фільтр + UI для format
6. dynamic-field-renderer: передача props
7. composite-subfields-editor: format для text_input (якщо потрібно)
