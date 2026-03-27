"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Table2, KanbanSquare, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCardCategoryId,
  setCardCategoryId,
  getCardViewMethod,
  setCardViewMethod,
} from "@/lib/management-state";
import { MANAGEMENT_STALE_MS, managementAdminKeys } from "@/lib/query-keys";
import { fetchAdminCategories } from "@/lib/api/admin/catalog";
import { TabsConfigManagement } from "./products-config/tabs-config-management";
import { ProductCardPreviewModal } from "./product-card-preview-modal";
import { DisplaySettingsManagement } from "./display-settings-management";

type CategoryWithCount = { id: string; name: string; order: number; _count?: { productTypes: number; tabs: number } };

const VIEW_METHODS = ["table", "kanban"] as const;
type ViewMethod = (typeof VIEW_METHODS)[number];

export function DisplayPage() {
  const { t } = useLocale();
  const hasInitializedCategoryRef = useRef(false);
  const openAddTabRef = useRef<(() => void) | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: [...managementAdminKeys.categories],
    queryFn: () => fetchAdminCategories(t) as Promise<CategoryWithCount[]>,
    staleTime: MANAGEMENT_STALE_MS,
  });

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [viewMethod, setViewMethod] = useState<ViewMethod>("table");

  useEffect(() => {
    if (categories.length === 0) return;
    const ids = new Set(categories.map((c) => c.id));

    if (selectedCategoryId && !ids.has(selectedCategoryId)) {
      const first = sortedCategories[0];
      if (first) {
        setSelectedCategoryId(first.id);
        setCardCategoryId(first.id);
      } else {
        setSelectedCategoryId("");
      }
      return;
    }

    if (hasInitializedCategoryRef.current) return;
    hasInitializedCategoryRef.current = true;

    const savedId = getCardCategoryId();
    const savedExists = savedId && ids.has(savedId);
    if (savedExists) {
      setSelectedCategoryId(savedId);
    } else {
      const first = sortedCategories[0];
      if (first) {
        setSelectedCategoryId(first.id);
        setCardCategoryId(first.id);
      }
    }

    const savedView = getCardViewMethod();
    if (savedView && VIEW_METHODS.includes(savedView)) {
      setViewMethod(savedView);
    }
  }, [categories, sortedCategories, selectedCategoryId]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCardCategoryId(categoryId);
  };

  const handleViewMethodChange = (method: ViewMethod) => {
    setViewMethod(method);
    setCardViewMethod(method);
  };

  const handleRequestCreateField = useCallback((categoryId: string) => {
    window.location.href = `/management/data-model?tab=data&createForCategory=${encodeURIComponent(categoryId)}`;
  }, []);

  type DisplayTab = "card" | "settings";
  const [displayTab, setDisplayTab] = useState<DisplayTab>("card");
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <Tabs
      value={displayTab}
      onValueChange={(v) => setDisplayTab(v as DisplayTab)}
      className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4 min-w-0"
    >
      <TabsList variant="line" className="w-full shrink-0">
        <TabsTrigger value="card" className="flex-1 min-w-0 text-xs sm:text-sm">
          {t("display.tabs.card")}
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex-1 min-w-0 text-xs sm:text-sm">
          {t("display.tabs.settings")}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="card"
        className="mt-0 flex flex-col gap-4 p-2 data-[state=inactive]:hidden md:p-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Select
              value={(selectedCategoryId || sortedCategories[0]?.id) || undefined}
              onValueChange={(id) => handleCategoryChange(id)}
              disabled={categories.length === 0}
            >
              <SelectTrigger className="w-fit min-w-[8rem]">
                <SelectValue
                  placeholder={
                    categories.length === 0
                      ? t("dataModel.createCategoryFirst")
                      : t("common.selectCategoryPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent className="min-w-max">
                {sortedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              aria-label={t("display.preview.title")}
              onClick={() => setPreviewOpen(true)}
              className="size-9"
              title={t("display.preview.title")}
            >
              <Eye className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[140px] justify-between shrink-0">
                {viewMethod === "table" ? (
                  <Table2 className="size-4" />
                ) : (
                  <KanbanSquare className="size-4" />
                )}
                {viewMethod === "table" ? t("display.viewTable") : t("display.viewKanban")}
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuRadioGroup
                value={viewMethod}
                onValueChange={(v) => handleViewMethodChange(v as ViewMethod)}
              >
                <DropdownMenuRadioItem value="table" className="gap-2">
                  <Table2 className="size-4" />
                  {t("display.viewTable")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="kanban" className="gap-2">
                  <KanbanSquare className="size-4" />
                  {t("display.viewKanban")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        <ProductCardPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          categoryId={selectedCategoryId || sortedCategories[0]?.id || null}
          viewMethod={viewMethod}
        />
        <TabsConfigManagement
          categoryId={selectedCategoryId || sortedCategories[0]?.id || ""}
          onRequestCreateField={handleRequestCreateField}
          openAddTabRef={openAddTabRef}
        />
      </TabsContent>

      <TabsContent
        value="settings"
        className="mt-0 p-2 data-[state=inactive]:hidden md:p-3"
      >
        <DisplaySettingsManagement />
      </TabsContent>
    </Tabs>
  );
}
