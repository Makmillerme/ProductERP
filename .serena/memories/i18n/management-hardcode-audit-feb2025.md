Audit of hardcoded strings in Management (Users, Automations, API).

FIXED:
1. vmd-parser-config-sheet.tsx: "JSON body" label (3x) → t("integrations.parser.jsonBody"). Added keys to uk.json, en.json.
2. users-table.tsx: formatDate used "uk-UA" → now locale-aware (locale from useLocale, intlLocale = en ? "en-US" : "uk-UA").
3. user-detail-sheet.tsx: formatDate (sessions table) → same locale-aware fix.
4. roles-table.tsx: formatDate → same locale-aware fix.

CLEAN (no hardcode):
- automations-page.tsx: all t()
- api-integrations-page.tsx: all t()
- api-tab.tsx: all t()
- integrations-tab.tsx: all t()
- users-management.tsx, user-detail-sheet, delete/ban/unban dialogs: all t()
- roles-management.tsx: all t()

COMMENTS (non-UI, Ukrainian): users-management.tsx L211, roles-management.tsx L251, user-detail-sheet L387, L403 - developer comments, not user-facing.