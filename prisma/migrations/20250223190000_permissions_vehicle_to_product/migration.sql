-- Міграція: vehicles → products, vehicles_config → products_config (config/permissions.ts Phase 5)
UPDATE role_permissions SET section_id = 'products' WHERE section_id = 'vehicles';
UPDATE role_permissions SET section_id = 'products_config' WHERE section_id = 'vehicles_config';
