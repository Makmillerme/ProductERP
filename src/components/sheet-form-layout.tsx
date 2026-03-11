"use client";

import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  SHEET_HEADER_CLASS,
  SHEET_BODY_CLASS,
  SHEET_BODY_SCROLL_CLASS,
  SHEET_FOOTER_CLASS,
} from "@/config/sheet";
import { cn } from "@/lib/utils";

type SheetFormLayoutProps = {
  title: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  bodyClassName?: string;
  scrollClassName?: string;
};

/**
 * Уніфікований layout для форм у Sheet: header + scrollable body + footer.
 * Використовує константи з config/sheet для компактного відображення.
 */
export function SheetFormLayout({
  title,
  headerExtra,
  children,
  footer,
  bodyClassName,
  scrollClassName,
}: SheetFormLayoutProps) {
  return (
    <>
      <SheetHeader className={cn(SHEET_HEADER_CLASS)}>
        <SheetTitle className="text-base font-semibold sm:text-lg">
          {title}
        </SheetTitle>
        {headerExtra}
      </SheetHeader>

      <div className={cn(SHEET_BODY_CLASS, bodyClassName)}>
        <div className={cn(SHEET_BODY_SCROLL_CLASS, scrollClassName)}>
          {children}
        </div>
      </div>

      <SheetFooter className={SHEET_FOOTER_CLASS}>
        {footer}
      </SheetFooter>
    </>
  );
}
