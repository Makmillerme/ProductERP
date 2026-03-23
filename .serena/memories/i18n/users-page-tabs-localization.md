UsersPage (users-page.tsx) - tabs localization fix completed.

Problem: Tabs "Користувачі" and "Ролі" were hardcoded in Ukrainian, so they did not switch when locale changed to English.

Fix: Replaced hardcoded strings with t("management.tabs.usersTab") and t("management.tabs.rolesTab"). Keys already exist in uk.json and en.json.

File: nextjs_vmd/src/features/management/components/users-page.tsx
Route: /management/users