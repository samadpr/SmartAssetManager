import { AssetType, AssignToType, TransferApprovalStatus } from "../../../enum/asset.enums";

// ---------------- USER ----------------
export interface TransferUserDto {
  userProfileId?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  designationDisplay?: string;
  departmentDisplay?: string;
}

// ---------------- AREA ----------------
export interface TransferAreaDto {
  areaId?: number;
  areaName?: string;
  areaDescription?: string;
}

// ---------------- SITE ----------------
export interface TransferSiteDto {
  siteId?: number;
  siteName?: string;
  siteDescription?: string;
  siteAddress?: string;
  siteType?: string;
  cityName?: string;
  area?: TransferAreaDto;
}

// ---------------- TRANSFER LEG ----------------
export interface AssetTransferLegDto {
  assignmentId: number;
  previousAssignmentId?: number;

  assetType: AssetType;
  assetTypeDisplay: string;

  assignTo: AssignToType;
  assignToDisplay: string;

  approvalStatus: TransferApprovalStatus;
  approvalStatusDisplay: string;

  approvedByLevel1?: string;
  approvedByLevel2?: string;
  approvedByLevel3?: string;

  level1ApprovedDate?: string;
  level2ApprovedDate?: string;
  level3ApprovedDate?: string;

  status?: string;

  transferDate?: string;
  dueDate?: string;
  createdDate: string;
  modifiedDate: string;

  holdStart?: string;
  holdEnd?: string;
  holdDays?: number;

  holderUser?: TransferUserDto;
  holderSite?: TransferSiteDto;

  transferredByEmail?: string;
  transferredByUser?: TransferUserDto;

  isDisposalLeg: boolean;
  disposalDate?: string;
  disposalMethod?: string;
  disposalDocument?: string;

  isCurrent: boolean;
}

// ---------------- PER ASSET ----------------
export interface AssetTransferHistoryDto {
  assetRowId: number;
  assetId: string;
  assetName?: string;
  assetBrand?: string;
  assetModelNo?: string;
  assetSerialNo?: string;
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  departmentDisplay?: string;
  imageUrl?: string;

  isDisposed: boolean;
  isCancelled: boolean;

  transferChain: AssetTransferLegDto[];

  currentHolder?: AssetTransferLegDto | null;
  
  totalTransfers: number;
  firstAssignedDate?: string;
  lastTransferDate?: string;
}

// ---------------- SUMMARY ----------------
export interface OrganisationTransferSummaryDto {
  organizationId: string;
  totalAssets: number;
  totalTransferLegs: number;
  totalActiveAssets: number;
  totalDisposedAssets: number;
  totalPendingApprovals: number;
}

// ---------------- FULL REPORT ----------------
export interface OrganisationTransferReportDto {
  organizationId: string;
  summary: OrganisationTransferSummaryDto;
  assets: AssetTransferHistoryDto[];
}