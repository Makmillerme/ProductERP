# Categories Management: Tree/Cascade UI Rewrite

## Date: 2026-02-23

## What changed
Rewrote `categories-management.tsx` from a two-panel layout (left: category list, right: detail table) to a **full-width tree/cascade view**.

## New Layout
- Single full-width container with `rounded-md border divide-y`
- Each **Category** = a collapsible row with:
  - ChevronRight (rotates 90deg when open)
  - Folder/FolderOpen icon
  - Name (font-medium), Code (Badge secondary), Description (text-xs, hidden md:inline)
  - Types count (`N typiv`)
  - `+` button to add a type to this category
  - `...` DropdownMenu with: Edit, Add type, Delete
- Under expanded Category: **VehicleType child rows** indented with `pl-12`:
  - CornerDownRight icon (tree connector)
  - Name, Code (Badge outline), Autodetect badge if applicable
  - Vehicles count (`N od.`)
  - `...` DropdownMenu with: Edit, Delete
- Empty state: text with inline 'Dodaty' link

## Components used
- Collapsible, CollapsibleTrigger, CollapsibleContent (radix)
- DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
- Badge (secondary for category code, outline for type code)
- Icons: ChevronRight, Folder, FolderOpen, MoreHorizontal, Pencil, Trash2, CornerDownRight, Plus

## State
- `openIds: Set<string>` tracks which categories are expanded
- `hasMounted` for hydration safety
- Search filters categories AND types (if type name/code matches, parent category is shown)

## Labels
- All labels are generic: 'typ tovaru' (not 'typ avto')
- Sheet titles: 'Nova katehoriia' / 'Novyj typ tovaru'

## Sheets unchanged
- Category create/edit Sheet (name, code, icon, order, description)
- VehicleType create/edit Sheet (name, code, description)
- Both with delete button in footer

## File
`nextjs_vmd/src/features/management/components/vehicles-config/categories-management.tsx`