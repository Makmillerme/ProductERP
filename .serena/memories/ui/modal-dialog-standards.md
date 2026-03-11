# Modal/Dialog Standards — Unified Template

## AlertDialog (confirmation/destructive) — STANDARD
```tsx
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>Title</AlertDialogTitle>
    <AlertDialogDescription>Description text ALWAYS here</AlertDialogDescription>
  </AlertDialogHeader>
  {/* AlertDialogBody — ONLY if extra form fields or error message */}
  {hasFormOrError && (
    <AlertDialogBody>
      {/* form fields, error */}
    </AlertDialogBody>
  )}
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Confirm</AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
```

## Dialog (form / content) — STANDARD
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Optional description</DialogDescription>
  </DialogHeader>
  <DialogBody> {/* always present */}
    {/* content */}
  </DialogBody>
  <DialogFooter>
    {/* buttons */}
  </DialogFooter>
</DialogContent>
```

## KEY RULE
AlertDialogDescription ALWAYS goes inside AlertDialogHeader (alongside Title).
NEVER put it inside AlertDialogBody.
AlertDialogBody is only for form fields and error messages.

## Status of all 10 modals (as of 2026-02-23)
| # | File | Status |
|---|---|---|
| 1 | ban-user-dialog.tsx | CORRECT |
| 2 | delete-user-dialog.tsx | CORRECT |
| 3 | unban-user-dialog.tsx | CORRECT |
| 4 | user-detail-sheet.tsx (inline AlertDialog) | CORRECT |
| 5 | vehicle-detail-sheet.tsx (inline AlertDialog) | FIXED - Description moved to Header |
| 6 | vehicle-media-lightbox.tsx (inline AlertDialog) | FIXED - Description moved to Header, empty Body removed |
| 7 | auth-modal.tsx | CORRECT |
| 8 | vehicles-page.tsx - Filter Dialog | CORRECT (ideal template) |
| 9 | vehicles-page.tsx - Columns Dialog | CORRECT (ideal template) |
| 10 | vehicle-media-lightbox.tsx (fullscreen viewer Dialog) | SPECIAL CASE - skip, non-standard media viewer |