import { EntityBase } from "../EntityBase.interface";

export interface AssetReportDto extends EntityBase {
  id?: number;
  assetId?: string;
  assetBrand?: string;
  assetModelNo?: string;
  assetSerialNo?: string;
  name?: string;
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

  // Dates
  dateOfPurchase?: Date;
  dateOfManufacture?: Date;
  yearOfValuation?: Date;

  // Assignment
  assetAssignedId?: number;
  assetType?: number;
  assignTo?: number;
  assignUserId?: number;
  assetStatus?: number;
  approverType?: number;
  transferAppStatus?: number;

  // Other
  isAvilable: boolean;
  note?: string;
  imageUrl?: string;

  // Display fields
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  supplierDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
  assignUserDisplay?: string;
  assetStatusDisplay?: string;
  assignToDisplay?: string;
  assetTypeDisplay?: string;

  createdByName?: string;
  organizationId?: string;
}

/* -------- Depreciation -------- */
export interface AssetDepreciationDto {
  year: number;
  bookValueYearBegining: number;
  depreciation: number;
  bookValueYearEnd: number;
}

export interface AssetReportDepreciationDto extends AssetReportDto {
  depreciationSchedule: AssetDepreciationDto[];
}

/* -------- Disposal -------- */
export interface AssetDisposalReportDto extends AssetReportDto {
  disposalAppStatus?: number;
  disposalDate?: Date;
  disposalMethod?: number;
  disposalDocument?: string;
}