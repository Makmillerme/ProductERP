# Валідація текстових полів — логіка

**Текстовий рядок (TextInput):** Короткий текст, одне значення. Валідація за типом: email, url, phone, slug, pattern. Елементи: required, error, pattern.

**Текстове поле (TextareaField):** Багато тексту, вільний вміст. Валідація тільки загальна: minLength, maxLength, minRows, maxRows, required. Без тип-специфічної валідації. Елементи: required, error.