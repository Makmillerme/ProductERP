Фаза 4 рефакторингу віджетів завершена (2026-02-23).

4.1 Документація systemColumn:
- docs/system-column-mapping.md: мапінг systemColumn → Product, валідні ключі, спеціальна обробка (cargo_dimensions, created_at, vin), isSystem у UI

4.2 Стратегія EAV:
- docs/eav-strategy.md: поточний стан (placeholder), варіанти A/B/C (JSON колонка, ProductAttribute, payload_json), рекомендація

4.3 isSystem у UI:
- Вже спрощено (field-definitions-modernization): колонка та Badge видалено
- Залишено canDelete з !isSystem для захисту системних полів