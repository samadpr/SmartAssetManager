// asset-batch-report.interface.ts

export interface BatchUnitRowDto {
  id: number;
  batchSequence?: number;
  assetId: string;
  assetSerialNo?: string;
  assetBrand?: string;
  assetModelNo?: string;

  // Assignment
  assignTo?: number;
  assignToDisplay?: string;
  assignUserId?: number;
  assignUserDisplay?: string;

  // Location
  siteId?: number;
  siteDisplay?: string;
  areaId?: number;
  areaDisplay?: string;

  // Status
  assetStatus?: number;
  assetStatusDisplay?: string;
  isAvilable: boolean;

  // Depreciation
  isDepreciable: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  depreciationMethod?: number;
  depreciationMethodDisplay?: string;
  dateAquired?: string;
  depreciationSchedule?: DepreciationScheduleRow[];

  // Disposal
  disposalAppStatus?: number;
  disposalDate?: string;
  disposalMethod?: number;
  disposalMethodDisplay?: string;
  disposalDocument?: string;

  // QR / Barcode
  qrcode?: string;
  barcode?: string;
  qrcodeImage?: string;
}

export interface DepreciationScheduleRow {
  year: number;
  bookValueYearBegining: number;
  depreciation: number;
  bookValueYearEnd: number;
}

export interface BatchReportSummaryDto {
  batchId: number;
  batchCode: string;
  assetName: string;
  description?: string;
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  imageUrl?: string;
  originalQuantity: number;
  activeQuantity: number;

  // Aggregates
  totalValue?: number;
  unitPrice?: number;
  assignedCount: number;
  unassignedCount: number;
  disposedCount: number;
  depreciableCount: number;
  totalDepreciableCost?: number;
  totalSalvageValue?: number;

  // Representative status
  assetStatus?: number;
  assetStatusDisplay?: string;
  statusBreakdown: Record<string, number>;

  // Metadata
  departmentDisplay?: string;
  supplierDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
  createdDate: string;
  createdByName?: string;
  organizationId?: string;

  // Units (null until expanded)
  units?: BatchUnitRowDto[] | null;

  // UI state (not from API)
  _expanded?: boolean;
  _loadingUnits?: boolean;
}

export interface PagedBatchReportDto {
  batches: BatchReportSummaryDto[];
  totalCount: number;
  page: number;
  pageSize: number;

  // Global stat-card aggregates
  grandTotalValue?: number;
  grandTotalUnits: number;
  grandTotalBatches: number;
  grandDepreciableUnits: number;
  grandDepreciableCost?: number;
  grandDisposedUnits: number;
  grandAssignedUnits: number;
}

export interface BatchPagedApiResponse {
  success: boolean;
  message: string;
  data: PagedBatchReportDto;
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BatchDetailApiResponse {
  success: boolean;
  message: string;
  data: BatchReportSummaryDto;
}