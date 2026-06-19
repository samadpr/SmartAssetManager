import { AssetStatus, AssetType, AssignToType, DepreciationMethod, DisposalMethod, TransferApprovalStatus } from "../../../enum/asset.enums";
// =============================================================================
//  GENERIC API RESPONSE WRAPPER
// =============================================================================
 
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
 
// =============================================================================
//  BATCH DTOs  (new — maps to AssetBatchListDto / AssetBatchDetailDto)
// =============================================================================
 
/**
 * One row in the main asset grid.
 * Maps to: AssetBatchListDto (backend)
 */
export interface AssetBatchListItem {
  batchId: number;
  batchCode: string;
  assetName: string;
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  originalQuantity: number;
  activeQuantity: number;
  imageUrl?: string;
  createdDate: string;
  createdBy: string;
  organizationId: string;
  assetStatusDisplay?: string;
  statusBreakdown?: AssetStatusCount[];
}

export interface AssetStatusCount {
  statusName: string;
  count: number;
}
 
/**
 * Expanded batch — header + all individual unit rows.
 * Maps to: AssetBatchDetailDto (backend)
 */
export interface AssetBatchDetail extends AssetBatchListItem {
  description?: string;
  assets: AssetDetail[]; // individual unit rows
}
 
// =============================================================================
//  INDIVIDUAL ASSET DTOs
// =============================================================================
 
/**
 * Full asset unit detail.
 * Maps to: AssetDetailDto (backend)
 */
export interface AssetDetail {
  id: number;
 
  // Batch linkage (populated after migration)
  batchId?: number;
  batchSequence?: number;
  batchCode?: string;
 
  // Identity
  assetId: string;
  assetBrand?: string;
  assetModelNo?: string;
  assetSerialNo?: string;
  name: string;
  description?: string;
 
  // Classification
  category?: number;
  categoryDisplay?: string;
  subCategory?: number;
  subCategoryDisplay?: string;
 
  // Quantity (always 1 per unit row after migration)
  quantity?: number;
 
  // Pricing
  unitPrice?: number;
  supplier?: number;
  supplierDisplay?: string;
 
  // Location
  siteId?: number;
  siteDisplay?: string;
  areaId?: number;
  areaDisplay?: string;
 
  // Department
  department?: number;
  departmentDisplay?: string;
  subDepartment?: number;
  subDepartmentDisplay?: string;
 
  warranetyInMonth?: number;
 
  // Depreciation
  isDepreciable?: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  depreciationMethod?: DepreciationMethod;
  dateAquired?: string;
 
  // Files
  imageUrl?: string;
  deliveryNote?: string;
  purchaseReceipt?: string;
  invoice?: string;
 
  // Dates
  dateOfPurchase?: string;
  dateOfManufacture?: string;
  yearOfValuation?: string;
 
  // Assignment
  assetAssignedId?: number;
  assetType?: AssetType;
  assetTypeDisplay?: string;
  assignTo?: AssignToType;
  assignToDisplay?: string;
  assignUserId?: number;
  assignUserDisplay?: string;
  assetStatus?: AssetStatus;
  assetStatusDisplay?: string;
  approverType?: number;
  transferAppStatus?: TransferApprovalStatus;
 
  // Disposal
  disposalAppStatus?: number;
  disposalDate?: string;
  disposalMethod?: DisposalMethod;
  disposalDocument?: string;
 
  // Other
  isAvilable: boolean;
  note?: string;
 
  // QR / Barcode
  qrcode?: string;        // AssetId text value — content encoded in both images
  qrcodeImage?: string;   // base64 PNG of QR code image
  barcode?: string;       // base64 PNG of barcode image
 
  // Audit
  createdDate?: string;
  createdBy?: string;
  organizationId?: string;
 
  // Related (loaded on detail view)
  assetHistory?: AssetHistory[];
  depreciationSchedule?: AssetDepreciation[];
  comments?: AssetComment[];
}
 
// =============================================================================
//  REQUEST OBJECTS  (match backend AssetRequestObject exactly)
// =============================================================================
 
/**
 * Request for create / update.
 * Maps to: AssetRequestObject (backend)
 *
 * For Quantity > 1:
 *   - Provide serialNumbers[] with one per unit (length must equal quantity)
 *   - OR provide assetSerialNo as a base prefix (backend auto-suffixes -001, -002...)
 *   - OR leave both empty (backend uses "SN-001", "SN-002"...)
 */
export interface AssetRequest {
  // Update only (null for create)
  id?: number;
 
  // Identity
  assetBrand?: string;
  assetModelNo?: string;
 
  /**
   * For single unit: the serial number.
   * For multi-unit: used as base prefix if serialNumbers[] is not provided.
   */
  assetSerialNo?: string;
 
  /**
   * Per-unit serial numbers for multi-unit create.
   * Count MUST equal quantity when supplied.
   * Sent as: serialNumbers[0], serialNumbers[1], ... in FormData.
   */
  serialNumbers?: string[];
 
  name: string;
  description?: string;
 
  // Classification
  category?: number;
  subCategory?: number;
 
  /**
   * Number of physical units to create.
   * Each gets its own Asset row, AssetId, QR code, and barcode.
   * Grouped under one AssetBatch.
   */
  quantity?: number;
 
  unitPrice?: number;
  supplier?: number;
  siteId?: number;
  areaId?: number;
  department?: number;
  subDepartment?: number;
  warranetyInMonth?: number;
  assetStatus?: number;
 
  // Depreciation
  isDepreciable: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  depreciationMethod?: number;
  dateAquired?: Date;
 
  // Files — pass File for new upload, string path for existing unchanged file
  imageFile?: File;
  imagePath?: string;
 
  deliveryNoteFile?: File;
  deliveryNotePath?: string;
 
  purchaseReceiptFile?: File;
  purchaseReceiptPath?: string;
 
  invoiceFile?: File;
  invoicePath?: string;
 
  // Dates
  dateOfPurchase?: Date;
  dateOfManufacture?: Date;
  yearOfValuation?: Date;
 
  // Assignment
  assignTo: AssignToType;
  assignUserId?: number;
  assignSiteId?: number;
  assignAreaId?: number;
  transferDate?: Date;
  dueDate?: Date;
 
  note?: string;

  unitAssignments?: UnitAssignmentRequest[];
}

export interface UnitAssignmentRequest {
  /** 1-based sequence matching the unit's BatchSequence */
  sequence: number;
  assignTo: AssignToType;
  assignUserId?: number;
  siteId?: number;
  areaId?: number;
  /** pass the same assetStatus used in the overall request */
  assetStatus: number;
}
 
// =============================================================================
//  BATCH QUANTITY UPDATE REQUEST
// =============================================================================
 
/**
 * Add or remove units from an existing batch.
 * Maps to: AssetBatchQuantityUpdateRequest (backend)
 */
export interface AssetBatchQuantityUpdateRequest {
  batchId: number;
 
  /** Serial numbers for NEW units to add — one row created per entry */
  addSerialNumbers?: string[];
 
  /** Asset row IDs to soft-delete from the batch */
  removeAssetIds?: number[];
 
  /** Reason shown in AssetHistory for removed units */
  removalReason?: string;
}
 
// =============================================================================
//  TRANSFER / DISPOSE / APPROVAL REQUESTS
// =============================================================================
 
export interface AssetTransferRequest {
  assetId: number;
  transferDate: Date | string;
  dueDate?: Date | string;
  assignTo: AssignToType;
  assignUserId?: number;
  siteId?: number;
  areaId?: number;
  note?: string;
}
 
export interface AssetDisposeRequest {
  assetId: number;
  disposalDate: Date;
  disposalMethod: DisposalMethod;
  disposalDocument?: File;
  comment?: string;
}
 
export interface AssetApprovalRequest {
  assetId: number;
  assignmentId: number;
}
 
// =============================================================================
//  APPROVAL LIST
// =============================================================================
 
export interface AssetApprovalListItem {
  assignmentId: number;
  assetRowId: number;
  assetId: string;
  assetType: AssetType;
  assignTo: AssignToType;
  requestedByEmail: string;
  requestedByName?: string;
  requestedByProfilePicture?: string;
  requestedDate: string;
  assignUserId?: number;
  assignUserName?: string;
  assignProfilePicture?: string;
  siteId?: number;
  siteName?: string;
  areaId?: number;
  areaName?: string;
  approvalStatus: TransferApprovalStatus;
  status: string;
  assetImageUrl?: string;
}
 
// =============================================================================
//  RELATED DATA
// =============================================================================
 
export interface AssetHistory {
  id: number;
  assetId: number;
  assignUserId?: number;
  assignUserName?: string;
  action?: string;
  note?: string;
  createdDate: string;
  createdBy?: string;
}
 
export interface AssetDepreciation {
  year: number;
  bookValueYearBegining: number;
  depreciation: number;
  bookValueYearEnd: number;
}
 
export interface AssetComment {
  id: number;
  assetId: number;
  message?: string;
  isAdmin: boolean;
  createdDate: string;
  createdBy?: string;
}
 
// =============================================================================
//  DROPDOWN HELPERS  (unchanged)
// =============================================================================
 
export interface AssetDropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  categoryId?: number;
  siteId?: number;
  departmentId?: number;
}
 
export interface AssetDropdownData {
  categories: AssetDropdownOption[];
  allSubCategories: AssetDropdownOption[];
  suppliers: AssetDropdownOption[];
  sites: AssetDropdownOption[];
  allAreas: AssetDropdownOption[];
  departments: AssetDropdownOption[];
  allSubDepartments: AssetDropdownOption[];
  depreciationMethods: AssetDropdownOption[];
  assignToOptions: AssetDropdownOption[];
  usersList: AssetDropdownOption[];
  assetStatus: AssetDropdownOption[];
}

export interface AssetBatchDeleteRequest {
  batchId: number;
  reason?: string;
}
 
export interface AssetUnitStatusUpdateRequest {
  assetIds: number[];
  newStatusId: number;
}