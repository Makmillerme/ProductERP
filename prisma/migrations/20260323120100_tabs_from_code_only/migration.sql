-- Clear tab data. System tab «Головна» створюється з коду (ensureSystemTab) при першому запиті.
DELETE FROM "tab_fields";
DELETE FROM "tab_definitions";
