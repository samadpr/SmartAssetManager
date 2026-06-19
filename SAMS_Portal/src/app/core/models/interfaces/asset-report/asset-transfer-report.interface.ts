import { AssetType, AssignToType, TransferApprovalStatus } from "../../../enum/asset.enums";

// ── User ─────────────────────────────────────────────────────────────────────
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
 
// ── Area ─────────────────────────────────────────────────────────────────────
export interface TransferAreaDto {
  areaId?: number;
  areaName?: string;
  areaDescription?: string;
}
 
// ── Site ─────────────────────────────────────────────────────────────────────
export interface TransferSiteDto {
  siteId?: number;
  siteName?: string;
  siteDescription?: string;
  siteAddress?: string;
  siteType?: string;
  cityName?: string;
  area?: TransferAreaDto;
}
 
// ── Transfer Leg ─────────────────────────────────────────────────────────────
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
 
// ── Per Asset Unit ────────────────────────────────────────────────────────────
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
 
  // Batch info (NEW)
  batchId?: number;
  batchCode?: string;
  batchSequence?: number;
 
  isDisposed: boolean;
  isCancelled: boolean;
 
  transferChain: AssetTransferLegDto[];
  currentHolder?: AssetTransferLegDto | null;
 
  totalTransfers: number;
  firstAssignedDate?: string;
  lastTransferDate?: string;
}
 
// ── Batch Transfer Summary (NEW) ─────────────────────────────────────────────
// Groups all units within a batch for the batch-level view
export interface BatchTransferSummaryDto {
  batchId: number;
  batchCode: string;
  assetName: string;
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  imageUrl?: string;
  originalQuantity: number;
  activeQuantity: number;
  totalTransferLegs: number;
  activeUnits: number;
  disposedUnits: number;
  pendingApprovalUnits: number;
  units: AssetTransferHistoryDto[];
  // Computed on frontend
  _expanded?: boolean;
  _loadingUnits?: boolean;
}
 
// ── Organisation Summary ─────────────────────────────────────────────────────
export interface OrganisationTransferSummaryDto {
  organizationId: string;
  totalAssets: number;
  totalBatches?: number;
  totalTransferLegs: number;
  totalActiveAssets: number;
  totalDisposedAssets: number;
  totalPendingApprovals: number;
}
 
// ── Full Organisation Report ──────────────────────────────────────────────────
export interface OrganisationTransferReportDto {
  organizationId: string;
  summary: OrganisationTransferSummaryDto;
  assets: AssetTransferHistoryDto[];
}
 
// ── Filter chip helper ────────────────────────────────────────────────────────
export interface FilterChip {
  key: string;
  label: string;
}