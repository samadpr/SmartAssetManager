import { AssetStatus, AssetType, AssignToType, DepreciationMethod, DisposalMethod, TransferApprovalStatus } from "../../../enum/asset.enums";

export interface AssetRequest {
  id?: number;
  assetBrand: string;
  assetModelNo: string;
  assetSerialNo: string;
  name: string;
  description?: string;
  category?: number;
  subCategory?: number;
  quantity?: number;
  unitPrice?: number;
  supplier?: number;
  siteId?: number;
  areaId?: number;
  department?: number;
  subDepartment?: number;
  warranetyInMonth?: number;

  // Depreciation
  isDepreciable: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  depreciationMethod?: number;
  dateAquired?: Date;

  // Files - Support both File objects and URL strings
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
  assignTo: number;
  assignUserId?: number;
  assignSiteId?: number;
  assignAreaId?: number;
  transferDate?: Date;
  dueDate?: Date;

  note?: string;
}

export interface AssetResponse {
  id: number;
  assetId: string;
  name: string;
  assetBrand: string;
  assetModelNo: string;
  assetSerialNo?: string;
  unitPrice?: number;
  isAvilable: boolean;
  note?: string;

  // Display-only (from backend)
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  supplierDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;

  // Files (relative or absolute)
  imageUrl?: string;
  deliveryNote?: string;
  purchaseReceipt?: string;
  invoice?: string;
}

export interface AssetDetail extends AssetResponse {
  // IDs (used in edit mode)
  category?: number;
  subCategory?: number;
  quantity?: number;
  supplier?: number;
  siteId?: number;
  areaId?: number;
  department?: number;
  subDepartment?: number;
  warranetyInMonth?: number;

  // Depreciation
  isDepreciable?: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  depreciationMethod?: DepreciationMethod;
  dateAquired?: string;

  // Dates
  dateOfPurchase?: string;
  dateOfManufacture?: string;
  yearOfValuation?: string;

  // Assignment (ENUM VALUES)
  assignTo?: AssignToType;
  assignUserId?: number;
  assetStatus?: AssetStatus;
  assetType?: AssetType;

  // Display strings
  // locationDisplay?: string;
  assignUserDisplay?: string;
  assetStatusDisplay?: string;
  assignToDisplay?: string;
  assetTypeDisplay?: string;

  // Related data
  assetHistory?: AssetHistory[];
  depreciationSchedule?: AssetDepreciation[];
  comments?: Comment[];
}

export interface AssetHistory {
  id: number;
  assetId: number;
  AssignUserId: number;
  assignUserName: string;
  action: string;
  note: string;
  createdDate: string;
  createdBy: string;
}

export interface AssetDepreciation {
  year: number;
  bookValueYearBegining: number;
  depreciation: number;
  bookValueYearEnd: number;
}

export interface Comment {
  id: number;
  assetId: number;
  message: string;
  isAdmin: boolean;
  createdDate: string;
  createdBy: string;
}


// Dropdown option interface
export interface AssetDropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  categoryId?: number; // For subcategories
  siteId?: number; // For areas
  departmentId?: number; // For subdepartments
}

// Service response for dropdowns
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

export interface AssetTransferRequest {
  assetId: number;

  transferDate: Date | string;   // allow both
  dueDate?: Date | string;

  assignTo: AssignToType;

  // TO (new assignment)
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


// ---------------- APPROVAL REQUEST ----------------
export interface AssetApprovalRequest {
  assetId: number;
  assignmentId: number;
  // comment?: string; // keep optional if enabled later
}

// ---------------- APPROVAL LIST RESPONSE ----------------
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