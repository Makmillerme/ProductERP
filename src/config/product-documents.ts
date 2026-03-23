/** Тип документа товару (папки задаються в presetValues поля file_upload або tabConfig табу). */
export type ProductDoc = {
  id: number;
  productId: number;
  folder: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
};

/** @deprecated Use ProductDoc */
export type VehicleDoc = ProductDoc;
