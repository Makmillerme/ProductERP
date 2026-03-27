**computeGridLayout** (`grid-layout.ts`): прибрано скидання `row/col` на `targetR/targetC` після while (воно накладало full-row на попередні поля). Додано `rowMajorBefore` + кламп цілі до поточного курсора, доповнення рядка empty перед full-row якщо `col>0`, `advanceCursor` після поля. Це зберігає «+» у попередніх рядках і переносить full-width вниз.

**SelectField** порожні опції: не disabled; value `__unconfigured__` з одним SelectItem — можна відкрити й прочитати «налаштуйте»; обгортка `min-w-0 max-w-full`, trigger truncate.
