## Bug: RoleDetailSheet shows 'Нова роль' for custom roles

### Root cause
TanStack Query v5 timing gap: when `enabled` transitions `false → true`, there is one render where:
- `isLoading = false` (because `isLoading = isPending && isFetching`, and `isFetching` hasn't become `true` yet)
- `data = undefined`

This caused `isCreate = role === null && !detailLoading` to evaluate to `true` in `RoleDetailSheet`,
showing the 'Нова роль' (create) form instead of the role's detail.

### Fix (roles-management.tsx)
Replaced `isLoading` with a manually derived `detailLoading` using `isPending`:
```ts
const { data: roleDetail, isPending: roleDetailPending, ... } = useQuery({...});
const detailLoading = roleDetailPending && !createOpen && !!selectedRoleId && selectedRoleId !== ADMIN_SYSTEM_ROLE_ID;
```
`isPending = true` immediately when `selectedRoleId` is set (no gap), covering the brief moment before `isFetching` becomes `true`.

### Key rule for TanStack Query v5
- Use `isPending` (not `isLoading`) when you need to detect 'no data yet' state, especially when `enabled` is dynamic.